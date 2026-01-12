import * as cheerio from 'cheerio';

// Patterns that indicate non-recipe images (logos, icons, UI elements, etc.)
const exclusionPatterns = [
  'placeholder',
  'logo',
  'brand',
  'user',
  'avatar',
  'gravatar',
  'plugin',
  'spatula',
  'baking-pan',
  'equipment',
  'step',
  'ingredient',
  'portrait',
  'icon',
  'ebook',
];

// Common adjectives/descriptors in recipe names that won't help in matches
const commonWords = new Set([
  'fudgy',
  'best',
  'easy',
  'quick',
  'simple',
  'perfect',
  'ultimate',
  'amazing',
  'delicious',
  'homemade',
  'classic',
  'traditional',
  'new',
  'old',
  'favorite',
  'favourite',
  'special',
  'healthy',
  'vegan',
  'gluten-free',
]);

// Common words in alt text that indicate non-recipe images
const altExclusionPatterns = [
  'logo',
  'advertisement',
  'sponsor',
  'banner',
  'icon',
  'button',
  'avatar',
  'profile',
  'placeholder',
  'decorative',
  'cookbook',
];

export const getImageBaseFilename = (url: string): string => {
  const urlLower = url.toLowerCase();
  const filename = urlLower.split('/').pop() || '';
  // Remove dimension patterns like -683x1024, -150x150, -600x900-1, etc.
  // Also remove file extensions temporarily
  const withoutExt = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
  // Remove dimension patterns: -WIDTHxHEIGHT or -WIDTHxHEIGHT-NUMBER
  const base = withoutExt.replace(/-\d+x\d+(-\d+)?$/i, '');
  return base;
};

// Get image quality based on dimensions in the URL or explicit dimensions
export const getImageQuality = (
  url: string,
  width?: number,
  height?: number,
): number => {
  // If we have explicit dimensions from ImageObject, use those
  if (width && height) {
    return width * height;
  }

  // Otherwise, extract from URL
  const urlLower = url.toLowerCase();
  const filename = urlLower.split('/').pop() || '';
  // Extract dimensions if present (e.g., 683x1024)
  const dimensionMatch = filename.match(/-(\d+)x(\d+)/);
  if (dimensionMatch) {
    const w = parseInt(dimensionMatch[1], 10);
    const h = parseInt(dimensionMatch[2], 10);
    return w * h; // Total pixels
  }
  // If no dimensions, assume it's a high-quality original
  return 1000000;
};

const getImageUrl = (src: string, alt: string, baseUrl: string) => {
  // Convert relative paths to absolute URLs
  try {
    // If it's already an absolute URL, return as-is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return { src, alt: alt };
    }
    // If it's a protocol-relative URL (starts with //), add https:
    if (src.startsWith('//')) {
      return { src: `https:${src}`, alt: alt };
    }
    // Otherwise, resolve relative path against base URL
    return { src: new URL(src, baseUrl).href, alt: alt };
  } catch (error) {
    // If URL resolution fails, return original (will be filtered out later)
    console.warn(`Failed to resolve image URL: ${src}`, error);
    return { src: src, alt: alt };
  }
};

const getImageScore = (
  src: string,
  alt: string,
  recipeWords: string[],
  normalizedName: string,
) => {
  const urlLower = src.toLowerCase();
  const filename = urlLower.split('/').pop() || '';
  const altLower = alt.toLowerCase();
  let score = 0;

  // Exact match in filename/URL gets highest score
  if (filename.includes(normalizedName) || urlLower.includes(normalizedName)) {
    score += 20;
  }

  // Exact match in alt text also gets high score
  if (altLower.includes(normalizedName)) {
    score += 15;
  }

  // Helper function to check if a word matches in text (handles plurals)
  const wordMatches = (text: string, word: string): boolean => {
    // Check exact match
    if (text.includes(word)) return true;

    // Handle plurals: if recipe word ends with 's', check without it
    if (word.endsWith('s') && word.length > 1) {
      const singular = word.slice(0, -1);
      if (text.includes(singular)) return true;
    }

    // Handle singular: if recipe word doesn't end with 's', check with 's'
    if (!word.endsWith('s')) {
      const plural = word + 's';
      if (text.includes(plural)) return true;
    }

    return false;
  };

  // Count how many meaningful recipe words appear in filename/URL
  const filenameMatchingWords = recipeWords.filter(
    (word) => wordMatches(filename, word) || wordMatches(urlLower, word),
  );

  // Count how many meaningful recipe words appear in alt text
  const altMatchingWords = recipeWords.filter((word) =>
    wordMatches(altLower, word),
  );

  // Combine all matching words (unique)
  const allMatchingWords = Array.from(
    new Set([...filenameMatchingWords, ...altMatchingWords]),
  );

  // Score based on matches in filename/URL
  score += filenameMatchingWords.length * 5;

  // Score based on matches in alt text (slightly lower weight since alt can be less reliable)
  score += altMatchingWords.length * 4;

  // Bonus if alt text has matches (helps with generic filenames like IMG_9185)
  if (altMatchingWords.length > 0 && filenameMatchingWords.length === 0) {
    score += 10; // Extra bonus for alt text saving a generic filename
  }

  // Bonus if most/all words match
  if (recipeWords.length > 0) {
    const matchRatio = allMatchingWords.length / recipeWords.length;
    if (matchRatio >= 0.5) score += 10; // At least half the words match
    if (matchRatio >= 0.75) score += 5; // Most words match
  }

  // Penalize thumbnails and small images
  if (
    filename.includes('thumb') ||
    filename.includes('150x150') ||
    filename.includes('300x300')
  ) {
    score -= 3;
  }

  // Penalize header images that don't match recipe name
  if (
    filename.includes('header') &&
    allMatchingWords.length === 0 &&
    altMatchingWords.length === 0
  ) {
    score -= 5;
  }

  return {
    src,
    alt,
    score,
    matchingWords: allMatchingWords.length,
    filenameMatches: filenameMatchingWords.length,
    altMatches: altMatchingWords.length,
  };
};

export const getRecipeImages = (
  $: cheerio.CheerioAPI,
  recipeName: string,
  baseUrl: string,
): string[] => {
  // Remove common words
  const recipeWords = recipeName
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.has(word));

  // Normalize recipe name for exact matching (fallback)
  const normalizedName = recipeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Get all images from the page with their alt text
  const allImages = $('img')
    .map((_, el) => {
      // Different locations of image src
      const lazySrc = $(el).attr('data-lazy-src');
      const dataSrc = $(el).attr('data-src');
      const src = $(el).attr('src');

      // Also check the alt text
      const alt = $(el).attr('alt') || '';

      // Special case - handle SVG placeholder with data-u attribute (ShortPixel lazy loading)
      let finalSrc: string | undefined;
      if (src?.startsWith('data:image/svg+xml')) {
        try {
          // Decode base64 to get SVG string
          const base64Data = src.replace('data:image/svg+xml;base64,', '');
          const svgString = Buffer.from(base64Data, 'base64').toString('utf-8');

          // Parse SVG to extract data-u attribute
          const svgMatch = svgString.match(/data-u="([^"]+)"/);
          if (svgMatch && svgMatch[1]) {
            // Decode URL-encoded value
            finalSrc = decodeURIComponent(svgMatch[1]);
          }
        } catch {
          console.warn('Failed to decode data-u attribute:', src);
        }
      }

      finalSrc = finalSrc || lazySrc || dataSrc || src;

      return finalSrc ? { src: finalSrc, alt } : null;
    })
    .get()
    .filter((item): item is { src: string; alt: string } => {
      // Easy exclusions - no src, data URI, or SVG
      if (
        !item ||
        !item.src ||
        item.src.startsWith('data:') ||
        item.src.endsWith('.svg')
      )
        return false;

      // Smarter exclusions - filter out images matching exclusion patterns in URL or alt text
      const srcLower = item.src.toLowerCase();
      const altLower = item.alt.toLowerCase();
      if (
        exclusionPatterns.some((pattern) => srcLower.includes(pattern)) ||
        altExclusionPatterns.some((pattern) => altLower.includes(pattern))
      ) {
        return false;
      }

      return true;
    })
    .map((item) => getImageUrl(item.src, item.alt, baseUrl));

  // Score and categorize images
  const imageScores = allImages.map(({ src, alt }) =>
    getImageScore(src, alt, recipeWords, normalizedName),
  );

  // Sort by score (highest first), then by number of matching words
  imageScores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.matchingWords - a.matchingWords;
  });

  // Filter: require at least 1 matching word OR exact match in filename/URL/alt, AND minimum score of 5
  const filteredImages = imageScores.filter((item) => {
    // Must have at least 1 matching word OR exact match in filename/URL/alt
    const hasMatch =
      item.matchingWords > 0 ||
      item.src.toLowerCase().includes(normalizedName) ||
      item.alt.toLowerCase().includes(normalizedName);
    // Must have a reasonable score (not just barely positive)
    return hasMatch && item.score >= 5;
  });

  // Group by base filename and keep the best version
  const imageMap: Record<
    string,
    { src: string; quality: number; score: number }
  > = {};

  filteredImages.forEach((item) => {
    const baseFilename = getImageBaseFilename(item.src);
    const quality = getImageQuality(item.src);

    // Filter out images below minimum size threshold
    // 100,000 pixels = roughly 300x300, which is a reasonable minimum for recipe images
    const MIN_IMAGE_QUALITY = 100000;
    if (quality < MIN_IMAGE_QUALITY && quality !== 1000000) {
      // Skip if below threshold (but keep images without dimensions, as they might be high quality)
      return;
    }

    const existing = imageMap[baseFilename];
    if (
      !existing ||
      quality > existing.quality ||
      (quality === existing.quality && item.score > existing.score)
    ) {
      imageMap[baseFilename] = {
        src: item.src,
        quality,
        score: item.score,
      };
    }
  });

  // Convert back to array, sort by score, and limit
  const deduplicatedImages = Object.values(imageMap)
    .filter((item) => item.score > 20)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.src);

  return deduplicatedImages;
};
