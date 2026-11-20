/** @jest-environment node */
import fs from 'fs';
import path from 'path';

import { getUser } from '@/lib/supabase/queries/user';
import { safeFetch } from '@/lib/utils/safeFetch';

import { parseRecipeFromUrl } from './recipeParser';

/**
 * Runs the whole parser against trimmed, anonymized copies of real recipe
 * pages. The fixtures keep each page's structure (JSON-LD shape, recipe card
 * markup, sections) but none of its identity: titles, images, and instruction
 * text are placeholders. See __fixtures__/README.md for how they are made and
 * how to add one. Image selection from page markup is covered in
 * getRecipeImages.test.ts, not here.
 */

jest.mock('@/lib/supabase/queries/user', () => ({ getUser: jest.fn() }));
jest.mock('@/lib/utils/safeFetch', () => ({ safeFetch: jest.fn() }));

type IngredientSections = [title: string | null, count: number][];

interface FixtureCase {
  fixture: string;
  structure: string;
  name: string;
  servings: number;
  ingredientSections: IngredientSections;
  firstIngredient: [quantity: string, name: string];
  stepCounts: number[];
  // Images come only from the JSON-LD; the fixtures contain no <img> tags.
  imageCount: number;
  hasNotes: boolean;
}

const FIRST_IMAGE = 'https://images.example.com/photos/recipe-1.jpg';

const CASES: FixtureCase[] = [
  {
    fixture: 'wprm-a',
    structure: 'WPRM, ingredient and step sections',
    name: 'Honey Oat Swirl Bread',
    servings: 1,
    ingredientSections: [
      ['Bread Dough', 11],
      ['Chocolate Cinnamon Filling', 8],
    ],
    firstIngredient: ['⅓ cup', 'whole milk (room temperature)'],
    stepCounts: [4, 1, 7],
    imageCount: 4,
    hasNotes: false,
  },
  {
    fixture: 'wprm-b',
    structure: 'WPRM, single section, notes',
    name: 'Brown Butter Oatmeal Cookies',
    servings: 6,
    ingredientSections: [[null, 13]],
    firstIngredient: ['1 cup (226 g)', 'salted butter, divided'],
    stepCounts: [11],
    imageCount: 4,
    hasNotes: true,
  },
  {
    fixture: 'tasty-recipes-a',
    structure: 'Tasty Recipes plugin, ingredient sections, notes',
    name: 'Apple Walnut Bread',
    servings: 1,
    ingredientSections: [
      [null, 8],
      ['Filling', 3],
      ['Cinnamon Crunch Topping', 4],
    ],
    firstIngredient: ['½ cup (120ml)', 'buttermilk, warmed to about 110°F'],
    stepCounts: [12],
    imageCount: 4,
    hasNotes: true,
  },
  {
    fixture: 'tasty-recipes-b',
    structure:
      'Tasty Recipes plugin, HowToSection steps, sections in both lists',
    name: 'Fudgy Chocolate Layer Cake',
    servings: 10,
    // "3 large eggs + 1 egg yolk" becomes two lines, so 16 rather than 15.
    ingredientSections: [
      ['Chocolate Cake', 16],
      ['Chocolate Fudge Frosting', 8],
    ],
    firstIngredient: ['1 ¾ cups (230 g)', 'all-purpose flour'],
    stepCounts: [4, 5],
    imageCount: 4,
    hasNotes: false,
  },
  {
    fixture: 'custom-a',
    structure: 'JSON-LD only, name has a "Recipe by <site>" suffix',
    name: 'Chocolate Truffles Recipe by Example Kitchen',
    servings: 12,
    ingredientSections: [[null, 6]],
    firstIngredient: ['1 ½ cups', 'graham cracker, crushed into fine crumbs'],
    stepCounts: [10],
    imageCount: 1,
    hasNotes: false,
  },
  {
    fixture: 'custom-b',
    structure: 'JSON-LD only, @type is an array',
    name: 'Easy Peanut Butter Energy Bites',
    servings: 48,
    ingredientSections: [[null, 8]],
    firstIngredient: ['0.75 cup', 'brown sugar'],
    stepCounts: [4],
    imageCount: 1,
    hasNotes: false,
  },
  {
    fixture: 'custom-c',
    structure: 'JSON-LD only, @type is an array, long ingredient notes',
    name: 'Bakery-Style Iced Lemon Cookies Recipe',
    servings: 24,
    ingredientSections: [[null, 13]],
    firstIngredient: ['10 ounces', 'powdered sugar (2 1/2 cups; 285g)'],
    stepCounts: [4],
    imageCount: 1,
    hasNotes: false,
  },
  {
    fixture: 'custom-d',
    structure: 'hashed class names, ingredient sections, slash metric amounts',
    name: 'Homemade Cardamom Buns',
    servings: 15,
    ingredientSections: [
      ['FOR THE DOUGH', 9],
      ['FOR THE FILLING', 5],
      ['FOR THE ICING AND ASSEMBLY', 6],
    ],
    firstIngredient: ['1 cup (240 grams)', 'whole milk'],
    stepCounts: [13],
    imageCount: 4,
    hasNotes: false,
  },
  {
    fixture: 'custom-e',
    structure: '.recipe__ingredients and .recipe__tips, trailing promo heading',
    name: 'Orange Marmalade Buns',
    servings: 12,
    ingredientSections: [[null, 19]],
    firstIngredient: ['4 ½ cups (540 g)', 'acme unbleached all-purpose flour'],
    stepCounts: [16],
    imageCount: 1,
    hasNotes: true,
  },
  {
    fixture: 'custom-f',
    structure:
      'ingredients in <p>/<div> pairs (not <li>s), so they come from JSON-LD',
    name: 'Best Cheddar Biscuits',
    servings: 12,
    // From JSON-LD: the page's own ingredient markup has no <li>s.
    ingredientSections: [[null, 7]],
    firstIngredient: [
      '3½ cups (438 g)',
      'all-purpose flour, plus more for surface',
    ],
    stepCounts: [6],
    imageCount: 3,
    hasNotes: false,
  },
];

const fixtureHtml = (fixture: string) =>
  fs.readFileSync(path.join(__dirname, '__fixtures__', `${fixture}.html`));

const sourceUrl = (fixture: string) => `https://example.com/recipes/${fixture}`;

const parseFixture = (fixture: string) => {
  (safeFetch as jest.Mock).mockResolvedValue({
    status: 200,
    headers: {},
    body: fixtureHtml(fixture),
  });

  return parseRecipeFromUrl(sourceUrl(fixture), [], [], []);
};

const sectionsOf = (
  ingredients: Awaited<ReturnType<typeof parseRecipeFromUrl>>['ingredients'],
): IngredientSections =>
  ingredients.map((section) => [
    section.title ?? null,
    section.ingredients.length,
  ]);

describe('parseRecipeFromUrl against real page fixtures', () => {
  // Real pages have ingredient lines with no quantity ("flaky salt, for
  // finishing"), which the parser logs about. That is expected here, so mute
  // only that message and let any other error through.
  const originalConsoleError = console.error;
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].startsWith('Unable to parse')
      ) {
        return;
      }
      originalConsoleError(...args);
    });
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    (getUser as jest.Mock).mockResolvedValue({ id: 'u1' });
  });

  it.each(CASES)('$fixture ($structure)', async (expected) => {
    const { recipe, ingredients, imageUrls } = await parseFixture(
      expected.fixture,
    );

    expect(recipe.name).toBe(expected.name);
    expect(recipe.servings).toBe(expected.servings);
    expect(recipe.sourceUrl).toBe(sourceUrl(expected.fixture));
    expect(recipe.instructions.map((s) => s.steps.length)).toEqual(
      expected.stepCounts,
    );
    expect(Boolean(recipe.notes)).toBe(expected.hasNotes);
    expect(imageUrls).toHaveLength(expected.imageCount);
    expect(imageUrls?.[0]).toBe(FIRST_IMAGE);

    expect(sectionsOf(ingredients)).toEqual(expected.ingredientSections);
    const first = ingredients[0].ingredients[0];
    expect([first.quantity, first.name]).toEqual(expected.firstIngredient);
  });

  it('custom-d: splits the separately weighed flour into two lines', async () => {
    // The page lists "¼ cup/34 grams plus 4 cups/540 grams all-purpose flour":
    // two amounts weighed separately, used in different steps.
    const { ingredients } = await parseFixture('custom-d');

    const flour = ingredients[0].ingredients
      .filter(({ name }) => name === 'all-purpose flour')
      .map(({ quantity }) => quantity);

    expect(flour).toEqual(['¼ cup (34 grams)', '4 cups (540 grams)']);
  });
});
