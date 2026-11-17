import { isAllowedImageUrl } from './imageUrl';

const SUPABASE = 'https://abc.supabase.co';

describe('isAllowedImageUrl', () => {
  it('accepts recipe-images bucket URLs', () => {
    expect(
      isAllowedImageUrl(
        `${SUPABASE}/storage/v1/object/public/recipe-images/a.jpg`,
        SUPABASE,
      ),
    ).toBe(true);
  });

  it('rejects other hosts, other buckets, empty and invalid values', () => {
    expect(isAllowedImageUrl('https://example.com/a.jpg', SUPABASE)).toBe(
      false,
    );
    expect(
      isAllowedImageUrl(
        `${SUPABASE}/storage/v1/object/public/other/a.jpg`,
        SUPABASE,
      ),
    ).toBe(false);
    expect(isAllowedImageUrl('', SUPABASE)).toBe(false);
    expect(isAllowedImageUrl(null, SUPABASE)).toBe(false);
    expect(isAllowedImageUrl('not a url', SUPABASE)).toBe(false);
    expect(isAllowedImageUrl('https://abc.supabase.co/x.jpg', undefined)).toBe(
      false,
    );
  });
});
