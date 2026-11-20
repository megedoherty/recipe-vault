import { normalizeSourceUrl } from './url';

describe('normalizeSourceUrl', () => {
  it('returns null for empty, blank or invalid input', () => {
    expect(normalizeSourceUrl('')).toBeNull();
    expect(normalizeSourceUrl('   ')).toBeNull();
    expect(normalizeSourceUrl(null)).toBeNull();
    expect(normalizeSourceUrl(undefined)).toBeNull();
    expect(normalizeSourceUrl('not a url')).toBeNull();
  });

  it('trims whitespace and lowercases the host', () => {
    expect(normalizeSourceUrl('  https://Example.COM/Pancakes ')).toBe(
      'https://example.com/Pancakes',
    );
  });

  it('removes tracking params but keeps meaningful ones', () => {
    expect(
      normalizeSourceUrl('https://example.com/r?id=7&utm_source=x&fbclid=y'),
    ).toBe('https://example.com/r?id=7');
  });

  it('drops the hash and trailing slashes', () => {
    expect(normalizeSourceUrl('https://example.com/pancakes/#comments')).toBe(
      'https://example.com/pancakes',
    );
  });

  it('treats equivalent URLs as the same', () => {
    expect(normalizeSourceUrl('https://example.com/a/?ref=1#x')).toBe(
      normalizeSourceUrl('https://EXAMPLE.com/a'),
    );
  });
});
