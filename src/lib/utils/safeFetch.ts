import { lookup as dnsLookup, LookupAddress } from 'node:dns';
import http, { IncomingMessage } from 'node:http';
import https from 'node:https';
import { BlockList, isIP } from 'node:net';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import zlib from 'node:zlib';

/**
 * Fetches a user-supplied URL without letting it reach internal services (SSRF).
 *
 * - Only http(s) on the default ports.
 * - Hostnames are resolved by our own `lookup`, which rejects private, loopback,
 *   link-local and other non-public addresses. The connection is made to the
 *   address we validated, so DNS rebinding can't swap in a different one.
 * - Redirects are followed manually and every hop is validated.
 * - The response body is capped in size and the whole request is time-limited.
 */

const MAX_REDIRECTS = 5;

const blockedRanges = new BlockList();
const blockedIpv4: [string, number][] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8],
  ['169.254.0.0', 16], // link-local, cloud metadata
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved + broadcast
];
const blockedIpv6: [string, number][] = [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96], // NAT64, can embed private IPv4
  ['100::', 64],
  ['2001:db8::', 32],
  ['fc00::', 7], // unique local
  ['fe80::', 10], // link-local
  ['ff00::', 8], // multicast
];
blockedIpv4.forEach(([net, prefix]) =>
  blockedRanges.addSubnet(net, prefix, 'ipv4'),
);
blockedIpv6.forEach(([net, prefix]) =>
  blockedRanges.addSubnet(net, prefix, 'ipv6'),
);

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

/** IPv4-mapped IPv6 addresses (::ffff:a.b.c.d) are checked against the IPv4 rules. */
export function isPublicIp(address: string): boolean {
  const family = isIP(address);
  if (family === 0) return false;
  return !blockedRanges.check(address, family === 4 ? 'ipv4' : 'ipv6');
}

export function assertSafeUrl(url: URL): void {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('Only http and https URLs are allowed');
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError('URLs with credentials are not allowed');
  }
  const defaultPort = url.protocol === 'https:' ? '443' : '80';
  if (url.port && url.port !== defaultPort) {
    throw new UnsafeUrlError('Non-standard ports are not allowed');
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) && !isPublicIp(host)) {
    throw new UnsafeUrlError('URL points to a non-public address');
  }
}

// Passed to http(s).request so the address that is validated is the one connected to.
const safeLookup: typeof dnsLookup = ((
  hostname: string,
  options: { all?: boolean },
  callback: (
    err: NodeJS.ErrnoException | null,
    address?: string | LookupAddress[],
    family?: number,
  ) => void,
) => {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    const list = addresses as LookupAddress[];
    const bad = list.find((a) => !isPublicIp(a.address));
    if (bad || list.length === 0) {
      return callback(
        new UnsafeUrlError('URL resolves to a non-public address'),
      );
    }
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}) as typeof dnsLookup;

export type SafeFetchOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  headers?: Record<string, string>;
};

export type SafeFetchResult = {
  url: string;
  status: number;
  headers: IncomingMessage['headers'];
  body: Buffer;
};

function decoderFor(encoding: string | undefined) {
  switch (encoding) {
    case 'gzip':
    case 'x-gzip':
      return zlib.createGunzip();
    case 'deflate':
      return zlib.createInflate();
    case 'br':
      return zlib.createBrotliDecompress();
    default:
      return null;
  }
}

async function readBody(
  res: IncomingMessage,
  maxBytes: number,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      total += chunk.length;
      if (total > maxBytes) {
        return cb(new Error(`Response exceeded ${maxBytes} bytes`));
      }
      chunks.push(chunk);
      cb();
    },
  });
  const decoder = decoderFor(res.headers['content-encoding']?.toLowerCase());
  const streams: (Readable | Transform)[] = decoder
    ? [res, decoder, limiter]
    : [res, limiter];
  await pipeline(streams as [Readable, ...Transform[]]);
  return Buffer.concat(chunks);
}

function requestOnce(
  url: URL,
  { timeoutMs, maxBytes, headers }: Required<SafeFetchOptions>,
): Promise<{ res: IncomingMessage; body?: Buffer }> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(
      url,
      {
        method: 'GET',
        lookup: safeLookup,
        headers: { 'Accept-Encoding': 'gzip, deflate, br', ...headers },
        timeout: timeoutMs,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          return resolve({ res });
        }
        readBody(res, maxBytes)
          .then((body) => resolve({ res, body }))
          .catch(reject);
      },
    );
    req.on('timeout', () =>
      req.destroy(
        Object.assign(new Error('Request timed out'), { name: 'AbortError' }),
      ),
    );
    req.on('error', reject);
    req.end();
  });
}

export async function safeFetch(
  input: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const opts: Required<SafeFetchOptions> = {
    timeoutMs: options.timeoutMs ?? 10000,
    maxBytes: options.maxBytes ?? 5 * 1024 * 1024,
    headers: options.headers ?? {},
  };

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new UnsafeUrlError(`Invalid URL: ${input}`);
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    assertSafeUrl(url);
    const { res, body } = await requestOnce(url, opts);
    if (!body) {
      url = new URL(res.headers.location as string, url);
      continue;
    }
    return {
      url: url.toString(),
      status: res.statusCode ?? 0,
      headers: res.headers,
      body,
    };
  }
  throw new Error('Too many redirects');
}
