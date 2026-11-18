/** @jest-environment node */
import * as cheerio from 'cheerio';

import {
  dedupeImagesByBaseFilename,
  getImageBaseFilename,
  getImageQuality,
  getRecipeImages,
} from './getRecipeImages';

const images = (html: string, name = 'Chocolate Chip Cookies') =>
  getRecipeImages(cheerio.load(html), name, 'https://example.com');

describe('getImageBaseFilename', () => {
  it('strips the extension and resize suffix, and lowercases', () => {
    expect(getImageBaseFilename('https://x.com/a/Cookies-683x1024.JPG')).toBe(
      'cookies',
    );
    expect(getImageBaseFilename('https://x.com/cookies-600x900-1.webp')).toBe(
      'cookies',
    );
  });

  it('leaves names without a resize suffix alone', () => {
    expect(getImageBaseFilename('https://x.com/cookies.png')).toBe('cookies');
    expect(getImageBaseFilename('https://x.com/dir/')).toBe('');
  });
});

describe('getImageQuality', () => {
  it('prefers explicit dimensions', () => {
    expect(getImageQuality('https://x.com/a-10x10.jpg', 200, 100)).toBe(20000);
  });

  it('reads dimensions from the filename', () => {
    expect(getImageQuality('https://x.com/a-683x1024.jpg')).toBe(683 * 1024);
  });

  it('assumes an original when there are no dimensions', () => {
    expect(getImageQuality('https://x.com/a.jpg')).toBe(1000000);
  });
});

describe('dedupeImagesByBaseFilename', () => {
  it('keeps the best version of each photo in first-seen order', () => {
    expect(
      dedupeImagesByBaseFilename([
        { url: 'https://x.com/a-150x150.jpg', quality: 22500 },
        { url: 'https://x.com/b.jpg', quality: 1000000 },
        { url: 'https://x.com/a-683x1024.jpg', quality: 699392 },
        { url: 'https://x.com/b-100x100.jpg', quality: 10000 },
      ]),
    ).toEqual(['https://x.com/a-683x1024.jpg', 'https://x.com/b.jpg']);
  });

  it('returns an empty list for no images', () => {
    expect(dedupeImagesByBaseFilename([])).toEqual([]);
  });
});

describe('getRecipeImages', () => {
  it('returns images that match the recipe name, best first', () => {
    const html = `
      <img src="https://cdn.com/chocolate-chip-cookies.jpg" alt="Chocolate chip cookies on a plate">
      <img src="https://cdn.com/IMG_9185.jpg" alt="Cookies">
      <img src="https://cdn.com/unrelated-soup.jpg" alt="Soup">`;

    expect(images(html)).toEqual([
      'https://cdn.com/chocolate-chip-cookies.jpg',
    ]);
  });

  it('resolves relative and protocol-relative URLs', () => {
    const html = `
      <img src="/img/chocolate-chip-cookies.jpg" alt="Chocolate chip cookies">
      <img src="//cdn.com/chocolate-chip-cookies-2.jpg" alt="Chocolate chip cookies">`;

    expect(images(html)).toEqual(
      expect.arrayContaining([
        'https://example.com/img/chocolate-chip-cookies.jpg',
        'https://cdn.com/chocolate-chip-cookies-2.jpg',
      ]),
    );
  });

  it('prefers lazy-loaded sources over the placeholder src', () => {
    const html = `
      <img src="https://cdn.com/placeholder.gif"
           data-lazy-src="https://cdn.com/chocolate-chip-cookies.jpg"
           alt="Chocolate chip cookies">
      <img src="data:image/gif;base64,AAAA"
           data-src="https://cdn.com/chocolate-chip-cookies-b.jpg"
           alt="Chocolate chip cookies">`;

    expect(images(html)).toEqual(
      expect.arrayContaining([
        'https://cdn.com/chocolate-chip-cookies.jpg',
        'https://cdn.com/chocolate-chip-cookies-b.jpg',
      ]),
    );
  });

  it('reads the real URL from a ShortPixel SVG placeholder', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" data-u="${encodeURIComponent(
      'https://cdn.com/chocolate-chip-cookies.jpg',
    )}"></svg>`;
    const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

    expect(images(`<img src="${src}" alt="Chocolate chip cookies">`)).toEqual([
      'https://cdn.com/chocolate-chip-cookies.jpg',
    ]);
  });

  it('ignores an SVG placeholder it cannot decode', () => {
    const src = `data:image/svg+xml;base64,${Buffer.from('<svg/>').toString('base64')}`;

    expect(images(`<img src="${src}" alt="Chocolate chip cookies">`)).toEqual(
      [],
    );
  });

  it('skips images without a src, data URIs, SVGs, and excluded patterns', () => {
    const html = `
      <img alt="Chocolate chip cookies">
      <img src="data:image/png;base64,AAAA" alt="Chocolate chip cookies">
      <img src="https://cdn.com/chocolate-chip-cookies.svg" alt="Chocolate chip cookies">
      <img src="https://cdn.com/logo-chocolate-chip-cookies.jpg" alt="Chocolate chip cookies">
      <img src="https://cdn.com/chocolate-chip-cookies.jpg" alt="Site logo">`;

    expect(images(html)).toEqual([]);
  });

  it('drops small resized images but keeps the larger version', () => {
    const html = `
      <img src="https://cdn.com/chocolate-chip-cookies-150x150.jpg" alt="Chocolate chip cookies">
      <img src="https://cdn.com/chocolate-chip-cookies-1200x800.jpg" alt="Chocolate chip cookies">`;

    expect(images(html)).toEqual([
      'https://cdn.com/chocolate-chip-cookies-1200x800.jpg',
    ]);
  });

  it('ignores common filler words in the recipe name', () => {
    const html = `<img src="https://cdn.com/chocolate-chip-cookies.jpg" alt="Chocolate chip cookies">`;

    expect(images(html, 'The Best Easy Chocolate Chip Cookies')).toEqual([
      'https://cdn.com/chocolate-chip-cookies.jpg',
    ]);
  });

  it('returns nothing when the page has no images', () => {
    expect(images('<p>No pictures</p>')).toEqual([]);
  });
});
