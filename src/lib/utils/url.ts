const TRACKING_PARAM_PREFIXES = ['utm_', 'mc_', 'pk_', 'hsa_', 'vero_'];
const TRACKING_PARAMS = new Set([
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'twclid',
  'ttclid',
  'igshid',
  'yclid',
  'mkt_tok',
  '_hsenc',
  '_hsmi',
  'ref',
  'ref_src',
  'si',
  'smid',
  'smtyp',
]);

/**
 * Returns the URL as a string with analytics/tracking query params removed.
 */
export function stripTrackingParams(urlObj: URL): string {
  const cleaned = new URL(urlObj.toString());

  for (const key of [...cleaned.searchParams.keys()]) {
    const lowerKey = key.toLowerCase();

    if (
      TRACKING_PARAMS.has(lowerKey) ||
      TRACKING_PARAM_PREFIXES.some((prefix) => lowerKey.startsWith(prefix))
    ) {
      cleaned.searchParams.delete(key);
    }
  }

  return cleaned.toString();
}

/**
 * Canonical form of a recipe's source URL, used for storing it and for finding
 * duplicates: trimmed, tracking params and hash removed, and no trailing slash
 * on the path (the host is lowercased by the URL parser).
 *
 * Returns null for empty or invalid input.
 */
export function normalizeSourceUrl(raw: string | null | undefined) {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(stripTrackingParams(new URL(trimmed)));
    url.hash = '';
    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
  } catch {
    return null;
  }
}
