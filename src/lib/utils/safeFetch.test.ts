/**
 * @jest-environment node
 */
import {
  assertSafeUrl,
  isPublicIp,
  safeFetch,
  UnsafeUrlError,
} from './safeFetch';

describe('isPublicIp', () => {
  it.each([
    '8.8.8.8',
    '93.184.216.34',
    '2606:4700:4700::1111',
    '::ffff:8.8.8.8',
  ])('allows %s', (ip) => expect(isPublicIp(ip)).toBe(true));

  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '255.255.255.255',
    '::1',
    '::',
    'fe80::1',
    'fd00::1',
    '::ffff:127.0.0.1',
    '::ffff:169.254.169.254',
    '64:ff9b::7f00:1',
    'not-an-ip',
  ])('blocks %s', (ip) => expect(isPublicIp(ip)).toBe(false));
});

describe('assertSafeUrl', () => {
  it('allows ordinary public URLs', () => {
    expect(() => assertSafeUrl(new URL('https://example.com/r'))).not.toThrow();
    expect(() =>
      assertSafeUrl(new URL('http://example.com:80/r')),
    ).not.toThrow();
  });

  it.each([
    'file:///etc/passwd',
    'ftp://example.com/x',
    'http://127.0.0.1/',
    'http://[::1]/',
    'http://169.254.169.254/latest/meta-data',
    'http://2130706433/', // decimal form of 127.0.0.1, normalized by URL
    'http://0x7f.1/',
    'https://example.com:8443/',
    'https://user:pw@example.com/',
  ])('rejects %s', (url) => {
    expect(() => assertSafeUrl(new URL(url))).toThrow(UnsafeUrlError);
  });
});

describe('safeFetch', () => {
  it('rejects invalid URLs', async () => {
    await expect(safeFetch('nope')).rejects.toThrow(UnsafeUrlError);
  });

  it('rejects hostnames that resolve to loopback', async () => {
    await expect(safeFetch('http://localhost/')).rejects.toThrow(/non-public/);
  });
});
