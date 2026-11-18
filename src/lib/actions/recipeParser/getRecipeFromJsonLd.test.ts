/** @jest-environment node */
import * as cheerio from 'cheerio';

import { defaultStorage } from '@/constants';

import { getRecipeFromJsonLd } from './getRecipeFromJsonLd';

const categories = [
  { id: 1, name: 'Cakes' },
  { id: 2, name: 'Cookies' },
  { id: 3, name: 'Bread' },
];
const knownIngredients = [{ id: '10', name: 'flour', category: 'Baking' }];

const parse = (...jsonLd: unknown[]) =>
  getRecipeFromJsonLd(
    cheerio.load(
      jsonLd
        .map(
          (data) =>
            `<script type="application/ld+json">${
              typeof data === 'string' ? data : JSON.stringify(data)
            }</script>`,
        )
        .join(''),
    ),
    'https://example.com/recipe',
    knownIngredients,
    categories,
  );

const recipe = (extra: Record<string, unknown> = {}) => ({
  '@type': 'Recipe',
  name: 'Basic Loaf',
  ...extra,
});

describe('getRecipeFromJsonLd', () => {
  describe('finding the recipe', () => {
    it('returns an empty default when there is no JSON-LD', () => {
      const result = parse();

      expect(result.ingredients).toEqual([]);
      expect(result.imageUrls).toBeNull();
      expect(result.recipe).toEqual({
        name: '',
        instructions: [],
        sourceUrl: null,
        imageUrl: null,
        servings: null,
        categoryId: null,
        equipmentIds: [],
        storage: defaultStorage,
        notes: null,
        mealTypeId: null,
        occasionId: null,
      });
    });

    it('ignores invalid and empty JSON-LD blocks', () => {
      expect(parse('{not json', '').recipe.name).toBe('');
      expect(parse('{not json', recipe()).recipe.name).toBe('Basic Loaf');
    });

    it('ignores entities that are not recipes', () => {
      expect(parse({ '@type': 'Article', name: 'Blog post' }).recipe.name).toBe(
        '',
      );
    });

    it('finds a recipe in a root array', () => {
      expect(parse([{ '@type': 'WebSite' }, recipe()]).recipe.name).toBe(
        'Basic Loaf',
      );
    });

    it('finds a recipe inside an @graph', () => {
      expect(
        parse({ '@graph': [{ '@type': 'WebPage' }, recipe()] }).recipe.name,
      ).toBe('Basic Loaf');
    });

    it('accepts an @type array that includes Recipe', () => {
      expect(
        parse({ '@type': ['Thing', 'Recipe'], name: 'Typed' }).recipe.name,
      ).toBe('Typed');
    });

    it('skips JSON null and scalar values', () => {
      expect(parse('null', '"text"', '42', recipe()).recipe.name).toBe(
        'Basic Loaf',
      );
    });

    it('uses the first recipe found and records the source URL', () => {
      const result = parse(
        recipe({ name: 'First' }),
        recipe({ name: 'Second' }),
      );

      expect(result.recipe.name).toBe('First');
      expect(result.recipe.sourceUrl).toBe('https://example.com/recipe');
      expect(result.recipe.storage).toEqual(defaultStorage);
      expect(result.recipe.equipmentIds).toEqual([]);
    });
  });

  describe('name', () => {
    it('decodes HTML entities', () => {
      expect(parse(recipe({ name: 'Mac &amp; Cheese' })).recipe.name).toBe(
        'Mac & Cheese',
      );
    });

    it('is empty when the name is missing', () => {
      expect(parse({ '@type': 'Recipe' }).recipe.name).toBe('');
    });
  });

  describe('category', () => {
    it('uses the recipe name first', () => {
      expect(
        parse(recipe({ name: 'Carrot Cake', keywords: 'cookies' })).recipe
          .categoryId,
      ).toBe(1);
    });

    it('falls back to keywords (string or array)', () => {
      expect(
        parse(recipe({ keywords: 'dessert, cookies' })).recipe.categoryId,
      ).toBe(2);
      expect(
        parse(recipe({ keywords: ['easy', 'cookies'] })).recipe.categoryId,
      ).toBe(2);
    });

    it('falls back to recipeCategory (string or array)', () => {
      expect(parse(recipe({ recipeCategory: 'Bread' })).recipe.categoryId).toBe(
        3,
      );
      expect(
        parse(recipe({ recipeCategory: ['Main', 'Bread'] })).recipe.categoryId,
      ).toBe(3);
    });

    it('is null when nothing matches', () => {
      expect(
        parse(recipe({ keywords: 'soup', recipeCategory: 'Dinner' })).recipe
          .categoryId,
      ).toBeNull();
    });
  });

  describe('ingredients', () => {
    it('parses recipeIngredient lines, decoding entities and matching known ingredients', () => {
      const { ingredients } = parse(
        recipe({
          recipeIngredient: ['2 cups flour', '1 tsp salt &amp; pepper'],
        }),
      );

      expect(ingredients).toHaveLength(1);
      expect(ingredients[0].ingredients).toEqual([
        expect.objectContaining({
          name: 'flour',
          quantity: '2 cups',
          ingredientId: '10',
        }),
        expect.objectContaining({ name: 'salt & pepper', ingredientId: null }),
      ]);
    });

    it('returns no ingredients when none are listed', () => {
      expect(parse(recipe()).ingredients).toEqual([]);
    });
  });

  describe('instructions', () => {
    const texts = (result: ReturnType<typeof parse>) =>
      result.recipe.instructions.map((section) => ({
        title: section.title,
        steps: section.steps.map((step) => step.text),
      }));

    it('splits a string into steps by line', () => {
      expect(
        texts(parse(recipe({ recipeInstructions: 'Mix.\nBake and cool.' }))),
      ).toEqual([{ title: null, steps: ['Mix.', 'Bake and cool.'] }]);
    });

    it('reads an array of strings and HowToSteps', () => {
      expect(
        texts(
          parse(
            recipe({
              recipeInstructions: [
                'Preheat to 350 F.',
                { '@type': 'HowToStep', text: 'Mix.' },
                { '@type': 'Unknown', text: 'ignored' },
                '',
              ],
            }),
          ),
        ),
      ).toEqual([{ title: null, steps: ['Preheat to 350°F.', 'Mix.'] }]);
    });

    it('reads a single HowToStep', () => {
      expect(
        texts(
          parse(
            recipe({
              recipeInstructions: { '@type': 'HowToStep', text: 'Only step.' },
            }),
          ),
        ),
      ).toEqual([{ title: null, steps: ['Only step.'] }]);
    });

    it('turns HowToSections into titled sections', () => {
      expect(
        texts(
          parse(
            recipe({
              recipeInstructions: [
                {
                  '@type': 'HowToSection',
                  name: 'Dough',
                  itemListElement: [
                    { '@type': 'HowToStep', text: 'Knead.' },
                    { '@type': 'HowToStep', text: '' },
                  ],
                },
                {
                  '@type': 'HowToSection',
                  name: 'Glaze:',
                  itemListElement: [{ '@type': 'HowToStep', text: 'Whisk.' }],
                },
              ],
            }),
          ),
        ),
      ).toEqual([
        { title: 'Dough', steps: ['Knead.'] },
        { title: 'Glaze', steps: ['Whisk.'] },
      ]);
    });

    it('keeps a HowToSection with no steps as an empty section', () => {
      expect(
        texts(
          parse(
            recipe({
              recipeInstructions: {
                '@type': 'HowToSection',
                name: 'Empty',
              },
            }),
          ),
        ),
      ).toEqual([{ title: 'Empty', steps: [] }]);
    });

    it('is empty when there are no instructions', () => {
      expect(parse(recipe()).recipe.instructions).toEqual([]);
    });
  });

  describe('images', () => {
    it('handles a single URL string', () => {
      const result = parse(recipe({ image: 'https://cdn.com/a.jpg' }));

      expect(result.recipe.imageUrl).toBe('https://cdn.com/a.jpg');
      expect(result.imageUrls).toEqual(['https://cdn.com/a.jpg']);
    });

    it('dedupes an array of URLs, keeping the largest of each photo', () => {
      const result = parse(
        recipe({
          image: [
            'https://cdn.com/a-150x150.jpg',
            'https://cdn.com/a-1200x800.jpg',
            'https://cdn.com/b.jpg',
          ],
        }),
      );

      expect(result.imageUrls).toEqual([
        'https://cdn.com/a-1200x800.jpg',
        'https://cdn.com/b.jpg',
      ]);
      expect(result.recipe.imageUrl).toBe('https://cdn.com/a-1200x800.jpg');
    });

    it('handles a single ImageObject', () => {
      const result = parse(
        recipe({
          image: { '@type': 'ImageObject', url: 'https://cdn.com/a.jpg' },
        }),
      );

      expect(result.imageUrls).toEqual(['https://cdn.com/a.jpg']);
    });

    it('uses ImageObject dimensions to pick the best version', () => {
      const result = parse(
        recipe({
          image: [
            {
              '@type': 'ImageObject',
              url: 'https://cdn.com/a-2000x2000.jpg',
              width: 100,
              height: 100,
            },
            {
              '@type': 'ImageObject',
              url: 'https://cdn.com/a-10x10.jpg',
              width: 2000,
              height: 1000,
            },
          ],
        }),
      );

      expect(result.imageUrls).toEqual(['https://cdn.com/a-10x10.jpg']);
    });

    it('has no image when none is given', () => {
      const result = parse(recipe());

      expect(result.imageUrls).toEqual([]);
      expect(result.recipe.imageUrl).toBeNull();
    });
  });

  describe('servings', () => {
    it.each([
      ['4 servings', 4],
      [['6', '6 servings'], 6],
      [8, 8],
      ['a few', null],
      [[], null],
      [[12 as unknown as string], null],
      [undefined, null],
    ])('reads recipeYield %p as %p', (recipeYield, expected) => {
      expect(parse(recipe({ recipeYield })).recipe.servings).toBe(expected);
    });
  });
});
