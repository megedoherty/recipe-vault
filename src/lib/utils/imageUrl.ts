export const IMAGE_STORAGE_PATH = '/storage/v1/object/public/recipe-images/';

/**
 * The next/image `remotePatterns` entry for our Supabase bucket, or none when
 * Supabase isn't configured. Shared with next.config.ts so the two can't drift.
 * The protocol follows the Supabase URL, so local (http) Supabase works too.
 */
export function getImageRemotePatterns(supabaseUrl: string | undefined) {
  if (!supabaseUrl) {
    return [];
  }

  const { protocol, hostname } = new URL(supabaseUrl);
  return [
    {
      protocol: protocol === 'http:' ? ('http' as const) : ('https' as const),
      hostname,
      pathname: `${IMAGE_STORAGE_PATH}**`,
    },
  ];
}

/**
 * Whether next/image can render this URL. Mirrors the `remotePatterns` rule in
 * next.config.ts: only our Supabase recipe-images bucket is allowed, and
 * next/image throws (taking the whole page down) for anything else.
 */
export function isAllowedImageUrl(
  url: string | null | undefined,
  supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL,
): url is string {
  if (!url || !supabaseUrl) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const supabase = new URL(supabaseUrl);
    return (
      parsed.protocol === supabase.protocol &&
      parsed.hostname === supabase.hostname &&
      parsed.pathname.startsWith(IMAGE_STORAGE_PATH)
    );
  } catch {
    return false;
  }
}
