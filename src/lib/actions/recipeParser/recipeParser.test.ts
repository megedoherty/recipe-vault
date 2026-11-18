/** @jest-environment node */
import { getUser } from '@/lib/supabase/queries/user';
import { safeFetch } from '@/lib/utils/safeFetch';

import { parseRecipeFromUrl } from './recipeParser';

jest.mock('@/lib/supabase/queries/user', () => ({ getUser: jest.fn() }));
jest.mock('@/lib/utils/safeFetch', () => ({ safeFetch: jest.fn() }));

const mockSafeFetch = safeFetch as jest.Mock;

const ingredients = [{ id: '10', name: 'flour', category: 'Baking' }];
const categories = [
  { id: 1, name: 'Cakes' },
  { id: 2, name: 'Cookies' },
  { id: 3, name: 'Bread' },
];
const mealTypes = [
  { id: 7, name: 'Dessert' },
  { id: 8, name: 'Breakfast' },
];
const equipment = [{ id: '5', name: 'Stand Mixer' }];

const respondWith = (html: string, status = 200) =>
  mockSafeFetch.mockResolvedValue({
    status,
    headers: {},
    body: Buffer.from(html),
  });

const jsonLd = (data: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(data)}</script>`;

const parse = (url = 'https://example.com/recipe') =>
  parseRecipeFromUrl(url, ingredients, categories, mealTypes, equipment);

describe('parseRecipeFromUrl', () => {
  beforeEach(() => {
    (getUser as jest.Mock).mockResolvedValue({ id: 'u1' });
  });

  describe('before fetching', () => {
    it('requires a signed-in user', async () => {
      (getUser as jest.Mock).mockResolvedValue(null);

      await expect(parse()).rejects.toThrow('User not found');
      expect(mockSafeFetch).not.toHaveBeenCalled();
    });

    it('rejects an invalid URL', async () => {
      await expect(parse('not a url')).rejects.toThrow(
        'Invalid recipe URL: not a url',
      );
      expect(mockSafeFetch).not.toHaveBeenCalled();
    });

    it('strips tracking params but keeps real ones', async () => {
      respondWith('<h1>x</h1>');

      await parse(
        'https://example.com/r?id=3&utm_source=a&FBCLID=b&ref=c&mc_cid=d&keep=1',
      );

      expect(mockSafeFetch).toHaveBeenCalledWith(
        'https://example.com/r?id=3&keep=1',
        expect.objectContaining({
          timeoutMs: 10000,
          headers: { 'User-Agent': expect.any(String) },
        }),
      );
    });
  });

  describe('fetch errors', () => {
    it.each([199, 404, 500])('throws for HTTP status %i', async (status) => {
      respondWith('', status);

      await expect(parse()).rejects.toThrow(
        `Failed to fetch recipe (${status})`,
      );
    });

    it('reports a timeout with the original URL', async () => {
      const abort = new Error('aborted');
      abort.name = 'AbortError';
      mockSafeFetch.mockRejectedValue(abort);

      await expect(parse()).rejects.toThrow(
        'Timed out fetching recipe from https://example.com/recipe',
      );
    });

    it('passes other fetch errors through', async () => {
      mockSafeFetch.mockRejectedValue(new Error('Blocked address'));

      await expect(parse()).rejects.toThrow('Blocked address');
    });
  });

  describe('with JSON-LD', () => {
    const html = `
      <html><head>${jsonLd({
        '@type': 'Recipe',
        name: 'Chocolate Cake',
        image: 'https://cdn.com/chocolate-cake.jpg',
        recipeIngredient: ['2 cups flour'],
        recipeInstructions: ['Beat in a stand mixer.', 'Bake.'],
        recipeYield: '12 servings',
      })}</head><body><h1>Different Title</h1></body></html>`;

    it('uses structured data and derives the rest', async () => {
      respondWith(html);

      const result = await parse();

      expect(result.recipe).toEqual(
        expect.objectContaining({
          name: 'Chocolate Cake',
          sourceUrl: 'https://example.com/recipe',
          imageUrl: 'https://cdn.com/chocolate-cake.jpg',
          servings: 12,
          categoryId: 1,
          mealTypeId: 7, // Cakes are desserts
          equipmentIds: ['5'],
        }),
      );
      expect(result.recipe.instructions[0].steps.map((s) => s.text)).toEqual([
        'Beat in a stand mixer.',
        'Bake.',
      ]);
      expect(result.ingredients[0].ingredients[0]).toEqual(
        expect.objectContaining({ name: 'flour', ingredientId: '10' }),
      );
      expect(result.imageUrls).toEqual(['https://cdn.com/chocolate-cake.jpg']);
    });

    it('prefers HTML ingredients when the page has them', async () => {
      respondWith(
        html.replace(
          '</body>',
          '<div class="ingredients"><ul><li>3 eggs</li></ul></div></body>',
        ),
      );

      const result = await parse();

      expect(result.ingredients[0].ingredients).toHaveLength(1);
      expect(result.ingredients[0].ingredients[0].name).toBe('eggs');
    });

    it('merges and dedupes JSON-LD and page images', async () => {
      respondWith(
        html.replace(
          '</body>',
          `<img src="https://cdn.com/chocolate-cake.jpg" alt="Chocolate cake">
           <img src="https://cdn.com/chocolate-cake-slice.jpg" alt="Chocolate cake slice"></body>`,
        ),
      );

      const result = await parse();

      expect(result.imageUrls).toEqual([
        'https://cdn.com/chocolate-cake.jpg',
        'https://cdn.com/chocolate-cake-slice.jpg',
      ]);
    });

    it('adds page notes', async () => {
      respondWith(
        html.replace(
          '</body>',
          '<div class="wprm-recipe-notes">Keeps 3 days.</div></body>',
        ),
      );

      expect((await parse()).recipe.notes).toBe('Keeps 3 days.');
    });
  });

  describe('HTML fallbacks', () => {
    const page = `
      <html><body>
        <h1> Blueberry Muffins </h1>
        <div class="wprm-recipe-servings">Yield: 6 muffins</div>
        <div class="ingredients"><ul><li>2 cups flour</li></ul></div>
        <div class="instructions"><ol><li>Preheat to 400 F.</li><li>Use a stand mixer.</li></ol></div>
      </body></html>`;

    it('reads the name, servings, ingredients and instructions from the page', async () => {
      respondWith(page);

      const result = await parse();

      expect(result.recipe.name).toBe('Blueberry Muffins');
      expect(result.recipe.servings).toBe(6);
      expect(result.ingredients[0].ingredients[0]).toEqual(
        expect.objectContaining({ name: 'flour', ingredientId: '10' }),
      );
      expect(result.recipe.instructions[0].steps.map((s) => s.text)).toEqual([
        'Preheat to 400°F.',
        'Use a stand mixer.',
      ]);
      expect(result.recipe.equipmentIds).toEqual(['5']);
    });

    it('guesses the meal type from the name when the category does not decide it', async () => {
      respondWith(page);

      const result = await parse();

      expect(result.recipe.categoryId).toBeNull();
      expect(result.recipe.mealTypeId).toBe(8); // Muffin -> Breakfast
    });

    it('guesses the category from the name', async () => {
      respondWith('<h1>Chocolate Chip Cookies</h1>');

      const result = await parse();

      expect(result.recipe.categoryId).toBe(2);
      expect(result.recipe.mealTypeId).toBe(7);
    });

    it('leaves fields empty when the page has nothing to find', async () => {
      respondWith('<html><body><p>Hello</p></body></html>');

      const result = await parse();

      expect(result.recipe).toEqual(
        expect.objectContaining({
          name: '',
          servings: null,
          categoryId: null,
          mealTypeId: null,
          equipmentIds: [],
          notes: null,
        }),
      );
      expect(result.recipe.instructions).toEqual([]);
      expect(result.ingredients).toEqual([]);
      expect(result.imageUrls).toBeNull();
    });

    it('leaves servings null when the yield has no number', async () => {
      respondWith(
        '<h1>Soup</h1><div class="tasty-recipes-yield">A crowd</div>',
      );

      expect((await parse()).recipe.servings).toBeNull();
    });

    it('resolves page image URLs against the site origin', async () => {
      respondWith(
        '<h1>Chocolate Chip Cookies</h1><img src="/img/chocolate-chip-cookies.jpg" alt="Chocolate chip cookies">',
      );

      expect((await parse('https://example.com/a/b?x=1')).imageUrls).toEqual([
        'https://example.com/img/chocolate-chip-cookies.jpg',
      ]);
    });

    it('sets no meal type id when the matching meal type is not configured', async () => {
      respondWith('<h1>Chocolate Chip Cookies</h1>');

      const result = await parseRecipeFromUrl(
        'https://example.com/r',
        ingredients,
        categories,
        [],
      );

      expect(result.recipe.mealTypeId).toBeNull();
      expect(result.recipe.equipmentIds).toEqual([]);
    });
  });
});
