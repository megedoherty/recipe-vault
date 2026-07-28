import { ShoppingListItem } from '@/types';

import {
  combineGrams,
  combineNonGramsQuantity,
  convertToCupsViaDensity,
  convertToGramsViaDensity,
  getGramsFromButterLine,
  getTablespoonsFromButterLine,
  groupByRecipe,
  groupCombined,
} from './shoppingList';

describe('combineGrams', () => {
  test('combines grams from parenthetical quantities', () => {
    const ingredients = [
      { quantity: '1 cup (120 g)', normalizedIngredientId: 1 },
      { quantity: '1 cup (120 g)', normalizedIngredientId: 1 },
    ];
    expect(combineGrams(ingredients)).toBe(240);
  });

  test('combines grams from plain gram ranges', () => {
    const ingredients = [
      { quantity: '340 g', normalizedIngredientId: 1 },
      { quantity: '453 g', normalizedIngredientId: 1 },
    ];
    expect(combineGrams(ingredients)).toBe(793);
  });

  test('returns null when any quantity has no gram amount', () => {
    const ingredients = [
      { quantity: '1 cup (120 g)', normalizedIngredientId: 1 },
      { quantity: '1 egg', normalizedIngredientId: 1 },
    ];
    expect(combineGrams(ingredients)).toBeNull();
  });

  test('returns null for butter ingredient ids even if grams are present', () => {
    const ingredients = [
      { quantity: '1 stick (113 g)', normalizedIngredientId: 79 },
    ];
    expect(combineGrams(ingredients)).toBeNull();
  });

  test('returns null for an empty or undefined list', () => {
    expect(combineGrams([])).toBeNull();
    expect(combineGrams(undefined)).toBeNull();
  });
});

describe('combineNonGramsQuantity', () => {
  test('sums plain numeric quantities', () => {
    const ingredients = [
      { quantity: '2', normalizedIngredientId: 5 },
      { quantity: '1 1/2', normalizedIngredientId: 5 },
    ];
    expect(combineNonGramsQuantity(ingredients)).toEqual([3.5, '']);
  });

  test('combines cup measurements via cup math', () => {
    const ingredients = [
      { quantity: '1 cup', normalizedIngredientId: 5 },
      { quantity: '2 tablespoons', normalizedIngredientId: 5 },
    ];
    const [amount, unit] = combineNonGramsQuantity(ingredients) ?? [];
    expect(unit).toBe('cups');
    expect(amount).toBeCloseTo(1.125);
  });

  test('handles butter ids by returning combined tablespoons', () => {
    const ingredients = [
      { quantity: '1 stick (113 g)', normalizedIngredientId: 79 },
      { quantity: '1 tablespoon', normalizedIngredientId: 79 },
    ];
    expect(combineNonGramsQuantity(ingredients)).toEqual([9, 'tablespoon']);
  });

  test('returns null when quantities cannot be combined', () => {
    const ingredients = [
      { quantity: '1 egg', normalizedIngredientId: 5 },
      { quantity: 'a pinch', normalizedIngredientId: 5 },
    ];
    expect(combineNonGramsQuantity(ingredients)).toBeNull();
  });
});

describe('getTablespoonsFromButterLine', () => {
  test('parses sticks + tablespoons math', () => {
    expect(
      getTablespoonsFromButterLine('3 sticks + 1 tablespoon (348 g)'),
    ).toBe(25);
  });

  test('parses a single stick quantity', () => {
    expect(getTablespoonsFromButterLine('1 stick (113 g)')).toBe(8);
  });

  test('parses explicit tablespoons in text', () => {
    expect(getTablespoonsFromButterLine('(8 tablespoons, 115 g)')).toBe(8);
  });

  test('parses cups at start', () => {
    expect(getTablespoonsFromButterLine('1 cup (227 g)')).toBe(16);
  });

  test('returns null for null input', () => {
    expect(getTablespoonsFromButterLine(null)).toBeNull();
  });
});

describe('getGramsFromButterLine', () => {
  test('prefers an embedded gram value in a "Tbsp; g" compound format', () => {
    expect(getGramsFromButterLine('1 cup (16 Tbsp; 226 g)')).toBe(226);
  });

  test('prefers an embedded gram value in a "tablespoon; g" compound format', () => {
    expect(getGramsFromButterLine('¾ cup (12 tablespoon; 170 g)')).toBe(170);
  });

  test('falls back to tablespoon-derived grams when no gram value is embedded', () => {
    // 1 stick = 8 tablespoons x 14.125 g/tbsp = 113 g
    expect(getGramsFromButterLine('1 stick')).toBeCloseTo(113);
  });

  test('returns null for null input', () => {
    expect(getGramsFromButterLine(null)).toBeNull();
  });

  test('returns null when neither grams nor tablespoons can be parsed', () => {
    expect(getGramsFromButterLine('a pinch')).toBeNull();
  });
});

describe('convertToCupsViaDensity', () => {
  test('converts a gram-only ingredient (no cup equivalent) to cups', () => {
    const ingredients = [
      { quantity: '120 g', normalizedIngredientId: 1 }, // All-purpose flour, 120 g/cup
    ];
    expect(convertToCupsViaDensity(ingredients)).toEqual([1, 'cup']);
  });

  test('combines a gram line and a native cup line for the same mapped ingredient', () => {
    const ingredients = [
      { quantity: '120 g', normalizedIngredientId: 1 },
      { quantity: '1 cup', normalizedIngredientId: 1 },
    ];
    expect(convertToCupsViaDensity(ingredients)).toEqual([2, 'cups']);
  });

  test('returns null for an ingredient with no density entry', () => {
    const ingredients = [{ quantity: '60 g', normalizedIngredientId: 29 }]; // Chicken
    expect(convertToCupsViaDensity(ingredients)).toBeNull();
  });

  test('returns null if a line cannot be resolved to cups or grams', () => {
    const ingredients = [{ quantity: 'a pinch', normalizedIngredientId: 1 }];
    expect(convertToCupsViaDensity(ingredients)).toBeNull();
  });

  test('returns null for an empty or undefined list', () => {
    expect(convertToCupsViaDensity([])).toBeNull();
    expect(convertToCupsViaDensity(undefined)).toBeNull();
  });

  test('converts butter (sticks/tablespoons/cups) via the dedicated butter conversion', () => {
    const ingredients = [
      { quantity: '1 stick (113 g)', normalizedIngredientId: 79 },
    ];
    // 1 stick = 8 tablespoons = 0.5 cup, and formatVolume displays sub-cup
    // amounts as whole tablespoons rather than decimal cups.
    expect(convertToCupsViaDensity(ingredients)).toEqual([8, 'tablespoons']);
  });

  test('converts chocolate chips given only in grams to cups', () => {
    const ingredients = [
      { quantity: '170 g', normalizedIngredientId: 42 }, // Semi-sweet chocolate chips, 170 g/cup
    ];
    expect(convertToCupsViaDensity(ingredients)).toEqual([1, 'cup']);
  });

  test('converts mini chocolate chips using their own (denser) density value', () => {
    const ingredients = [
      { quantity: '177 g', normalizedIngredientId: 43 }, // Mini semi-sweet chocolate chips, 177 g/cup
    ];
    expect(convertToCupsViaDensity(ingredients)).toEqual([1, 'cup']);
  });
});

describe('convertToGramsViaDensity', () => {
  test('converts butter (sticks/tablespoons/cups) to grams via the dedicated butter conversion', () => {
    const ingredients = [{ quantity: '1 stick', normalizedIngredientId: 79 }];
    // 1 stick = 8 tablespoons = 113 g exactly (113/8 g per tbsp x 8)
    expect(convertToGramsViaDensity(ingredients)).toBeCloseTo(113);
  });

  test('combines butter given in different units (stick + tablespoons) into grams', () => {
    const ingredients = [
      { quantity: '1 stick', normalizedIngredientId: 79 },
      { quantity: '2 tablespoons', normalizedIngredientId: 80 },
    ];
    // 8 tbsp + 2 tbsp = 10 tbsp x (113/8) g/tbsp = 141.25 g
    expect(convertToGramsViaDensity(ingredients)).toBeCloseTo(141.25);
  });

  test('returns null for butter when a line cannot be parsed', () => {
    const ingredients = [{ quantity: 'a pinch', normalizedIngredientId: 79 }];
    expect(convertToGramsViaDensity(ingredients)).toBeNull();
  });

  test('converts regular chocolate chips to grams', () => {
    const ingredients = [
      { quantity: '1 cup', normalizedIngredientId: 44 }, // Milk chocolate chips, 170 g/cup
    ];
    expect(convertToGramsViaDensity(ingredients)).toBe(170);
  });

  test('converts mini chocolate chips to grams using their own density value', () => {
    const ingredients = [
      { quantity: '1 cup', normalizedIngredientId: 43 }, // Mini semi-sweet chocolate chips, 177 g/cup
    ];
    expect(convertToGramsViaDensity(ingredients)).toBe(177);
  });
});

function makeItem(overrides: Partial<ShoppingListItem>): ShoppingListItem {
  return {
    id: 'id-1',
    recipeId: 'recipe-1',
    recipeName: 'Recipe One',
    name: 'milk',
    quantity: '1 cup',
    normalizedIngredientId: 1,
    normalizedIngredientName: null,
    category: 'Dairy',
    purchased: false,
    ...overrides,
  };
}

describe('groupCombined', () => {
  test('combines items with the same normalizedIngredientId across recipes', () => {
    const items = [
      makeItem({
        id: 'a',
        recipeId: 'r1',
        recipeName: 'Recipe A',
        quantity: '2 cups',
      }),
      makeItem({
        id: 'b',
        recipeId: 'r2',
        recipeName: 'Recipe B',
        quantity: '1 cup',
      }),
    ];

    const combined = groupCombined(items, false);
    expect(combined).toHaveLength(1);
    expect(combined[0].sourceItemIds.sort()).toEqual(['a', 'b']);
    expect(combined[0].quantity).toBeCloseTo(3);
    expect(combined[0].unit).toBe('cups');
  });

  test('falls back to name-based grouping when normalizedIngredientId is null', () => {
    const items = [
      makeItem({ id: 'a', normalizedIngredientId: null, name: 'Salt' }),
      makeItem({ id: 'b', normalizedIngredientId: null, name: 'salt' }),
      makeItem({ id: 'c', normalizedIngredientId: null, name: 'pepper' }),
    ];

    const combined = groupCombined(items);
    expect(combined).toHaveLength(2);
    const saltGroup = combined.find((group) => group.groupKey.includes('salt'));
    expect(saltGroup?.sourceItemIds.sort()).toEqual(['a', 'b']);
  });

  test('purchased is true only when every source item is purchased', () => {
    const items = [
      makeItem({ id: 'a', purchased: true }),
      makeItem({ id: 'b', purchased: false }),
    ];
    expect(groupCombined(items)[0].purchased).toBe(false);

    const allPurchased = [
      makeItem({ id: 'a', purchased: true }),
      makeItem({ id: 'b', purchased: true }),
    ];
    expect(groupCombined(allPurchased)[0].purchased).toBe(true);
  });

  test('lines label each source item with its recipe name', () => {
    const items = [
      makeItem({ id: 'a', recipeName: 'Recipe A', quantity: '2 cups' }),
      makeItem({ id: 'b', recipeName: null, quantity: '1 cup' }),
    ];
    const [combinedItem] = groupCombined(items);
    expect(combinedItem.lines).toEqual([
      '2 cups milk (Recipe A)',
      '1 cup milk (Manually Added)',
    ]);
  });

  test('combines a mixed cup + gram group via density conversion, honoring the preferGrams toggle', () => {
    const items = [
      makeItem({
        id: 'a',
        recipeName: 'Recipe A',
        name: 'flour',
        quantity: '1 cup',
        normalizedIngredientId: 1, // All-purpose flour, 120 g/cup
      }),
      makeItem({
        id: 'b',
        recipeName: 'Recipe B',
        name: 'flour',
        quantity: '60 g',
        normalizedIngredientId: 1,
      }),
    ];

    const [gramsResult] = groupCombined(items, true);
    expect(gramsResult.quantity).toBe(180);
    expect(gramsResult.unit).toBe('g');
    expect(gramsResult.sourceItemIds.sort()).toEqual(['a', 'b']);

    const [cupsResult] = groupCombined(items, false);
    expect(cupsResult.quantity).toBeCloseTo(1.5);
    expect(cupsResult.unit).toBe('cups');
  });

  test('returns null quantity for a mixed cup + gram group with no density entry', () => {
    const items = [
      makeItem({
        id: 'a',
        name: 'chicken',
        quantity: '1 cup',
        normalizedIngredientId: 29, // Chicken, not in GRAMS_PER_CUP
      }),
      makeItem({
        id: 'b',
        name: 'chicken',
        quantity: '60 g',
        normalizedIngredientId: 29,
      }),
    ];

    const [combinedItem] = groupCombined(items);
    expect(combinedItem.quantity).toBeNull();
  });

  test('combines a derived-density ingredient (honey) when one recipe gives grams and another gives tablespoons', () => {
    const items = [
      makeItem({
        id: 'a',
        name: 'honey',
        quantity: '42 g',
        normalizedIngredientId: 21, // Honey, 336 g/cup derived from 21 g/tbsp
      }),
      makeItem({
        id: 'b',
        name: 'honey',
        quantity: '2 tablespoons',
        normalizedIngredientId: 21,
      }),
    ];

    // 42 g (embedded) + 2 tablespoons (2/16 cup * 336 g/cup = 42 g) = 84 g
    const [gramsResult] = groupCombined(items, true);
    expect(gramsResult.quantity).toBeCloseTo(84);
    expect(gramsResult.unit).toBe('g');

    // 42 g / 336 g/cup = 0.125 cup, + 2 tablespoons (0.125 cup) = 0.25 cup = 4 tablespoons
    const [cupsResult] = groupCombined(items, false);
    expect(cupsResult.quantity).toBeCloseTo(4);
    expect(cupsResult.unit).toBe('tablespoons');
  });

  test('returns null quantity when a mapped ingredient has an unparseable quantity string', () => {
    const items = [
      makeItem({
        id: 'a',
        name: 'flour',
        quantity: '1 cup',
        normalizedIngredientId: 1,
      }),
      makeItem({
        id: 'b',
        name: 'flour',
        quantity: 'a pinch',
        normalizedIngredientId: 1,
      }),
    ];

    const [combinedItem] = groupCombined(items);
    expect(combinedItem.quantity).toBeNull();
  });

  test('same-unit groups for an unmapped ingredient still resolve via the native paths', () => {
    const allGrams = [
      makeItem({
        id: 'a',
        quantity: '1 cup (120 g)',
        normalizedIngredientId: 29, // Chicken, not in GRAMS_PER_CUP
      }),
      makeItem({ id: 'b', quantity: '60 g', normalizedIngredientId: 29 }),
    ];
    expect(groupCombined(allGrams)[0].quantity).toBe(180);
    expect(groupCombined(allGrams)[0].unit).toBe('g');

    const allCups = [
      makeItem({ id: 'a', quantity: '1 cup', normalizedIngredientId: 29 }),
      makeItem({ id: 'b', quantity: '1 cup', normalizedIngredientId: 29 }),
    ];
    expect(groupCombined(allCups)[0].quantity).toBeCloseTo(2);
    expect(groupCombined(allCups)[0].unit).toBe('cups');
  });

  test('a mapped ingredient given the same unit everywhere still honors the preferGrams toggle', () => {
    const allGramsEmbedded = [
      makeItem({
        id: 'a',
        quantity: '1 cup (120 g)',
        normalizedIngredientId: 1, // All-purpose flour, 120 g/cup
      }),
      makeItem({ id: 'b', quantity: '60 g', normalizedIngredientId: 1 }),
    ];
    // Every line has embedded grams already, so grams mode uses combineGrams
    // directly; imperial mode falls back to density conversion into cups
    // since these lines aren't natively cup-only.
    expect(groupCombined(allGramsEmbedded, false)[0].quantity).toBeCloseTo(1.5);
    expect(groupCombined(allGramsEmbedded, false)[0].unit).toBe('cups');
    expect(groupCombined(allGramsEmbedded, true)[0].quantity).toBe(180);
    expect(groupCombined(allGramsEmbedded, true)[0].unit).toBe('g');
  });

  test('regression: embedded grams take priority over density conversion when both would resolve', () => {
    // If a recipe's own text disagrees with the density table's g/cup value
    // (e.g. a brand of flour that's denser/lighter than 120 g/cup), the
    // recipe's stated grams should win over the generic density conversion.
    const items = [
      makeItem({
        id: 'a',
        quantity: '1 cup (130 g)', // recipe says 130 g/cup, not the table's 120
        normalizedIngredientId: 1, // All-purpose flour, 120 g/cup in GRAMS_PER_CUP
      }),
    ];

    const [gramsResult] = groupCombined(items, true);
    // 130 (embedded, from combineGrams), not 120 (what density conversion
    // would have computed from "1 cup" x 120 g/cup).
    expect(gramsResult.quantity).toBe(130);
    expect(gramsResult.unit).toBe('g');
  });

  test('preferGrams=true converts an all-cups group with a density entry to grams', () => {
    const allCups = [
      makeItem({ id: 'a', quantity: '1 cup', normalizedIngredientId: 1 }), // AP flour, 120 g/cup
      makeItem({ id: 'b', quantity: '1 cup', normalizedIngredientId: 1 }),
    ];

    const [combinedItem] = groupCombined(allCups, true);
    expect(combinedItem.quantity).toBe(240);
    expect(combinedItem.unit).toBe('g');
  });

  test('preferGrams=true falls back to imperial units when the ingredient has no density entry', () => {
    const allCups = [
      makeItem({ id: 'a', quantity: '1 cup', normalizedIngredientId: 29 }), // Chicken, not in GRAMS_PER_CUP
      makeItem({ id: 'b', quantity: '1 cup', normalizedIngredientId: 29 }),
    ];

    const [combinedItem] = groupCombined(allCups, true);
    expect(combinedItem.quantity).toBeCloseTo(2);
    expect(combinedItem.unit).toBe('cups');
  });

  test('preferGrams defaults to true, converting an all-cups group with a density entry to grams', () => {
    const allCups = [
      makeItem({ id: 'a', quantity: '1 cup', normalizedIngredientId: 1 }),
      makeItem({ id: 'b', quantity: '1 cup', normalizedIngredientId: 1 }),
    ];

    const [combinedItem] = groupCombined(allCups);
    expect(combinedItem.quantity).toBeCloseTo(240);
    expect(combinedItem.unit).toBe('g');
  });

  test('regression: a single ingredient with embedded grams switches to imperial when preferGrams is false', () => {
    // Reported bug: "1¼ cups (156 g) all-purpose flour" always showed in grams
    // regardless of the toggle, because combineGrams was checked unconditionally
    // before the toggle was consulted.
    const items = [
      makeItem({
        id: 'a',
        quantity: '1 1/4 cups (156 g)',
        normalizedIngredientId: 1, // All-purpose flour, 120 g/cup
      }),
    ];

    const [gramsResult] = groupCombined(items, true);
    expect(gramsResult.quantity).toBe(156);
    expect(gramsResult.unit).toBe('g');

    const [imperialResult] = groupCombined(items, false);
    expect(imperialResult.quantity).toBeCloseTo(1.25);
    expect(imperialResult.unit).toBe('cups');
  });

  test('regression: a gram-only ingredient with a density entry converts to cups when preferGrams is false', () => {
    const items = [
      makeItem({
        id: 'a',
        quantity: '156 g',
        normalizedIngredientId: 1, // All-purpose flour, 120 g/cup
      }),
    ];

    const [imperialResult] = groupCombined(items, false);
    expect(imperialResult.quantity).toBeCloseTo(1.3);
    expect(imperialResult.unit).toBe('cups');
  });

  test('regression: a gram-only ingredient with no density entry falls back to grams when preferGrams is false', () => {
    const items = [
      makeItem({
        id: 'a',
        quantity: '60 g',
        normalizedIngredientId: 29, // Chicken, not in GRAMS_PER_CUP
      }),
    ];

    const [imperialResult] = groupCombined(items, false);
    expect(imperialResult.quantity).toBe(60);
    expect(imperialResult.unit).toBe('g');
  });

  test('regression: milk converts to grams when preferGrams is true', () => {
    const items = [
      makeItem({
        id: 'a',
        name: 'milk',
        quantity: '2 tablespoons',
        normalizedIngredientId: 84, // Milk, 227 g/cup
      }),
    ];

    const [gramsResult] = groupCombined(items, true);
    // 2 tablespoons = 2/16 cup; 2/16 * 227 = 28.375
    expect(gramsResult.quantity).toBeCloseTo(28.375);
    expect(gramsResult.unit).toBe('g');
  });

  test('regression: the combined line uses the normalized ingredient name, not the first raw recipe line', () => {
    const items = [
      makeItem({
        id: 'a',
        name: 'unsalted butter, sliced into 16 Tbsp-size pieces',
        normalizedIngredientName: 'unsalted butter',
        quantity: '1 cup (226 g)',
        normalizedIngredientId: 79,
      }),
      makeItem({
        id: 'b',
        name: 'unsalted butter, room temperature',
        normalizedIngredientName: 'unsalted butter',
        quantity: '¾ cup (170 g)',
        normalizedIngredientId: 79,
      }),
    ];

    const [combinedItem] = groupCombined(items);
    expect(combinedItem.name).toBe('unsalted butter');
  });

  test('falls back to the first raw ingredient line when there is no normalized ingredient name', () => {
    const items = [
      makeItem({
        id: 'a',
        name: 'chicken breast',
        normalizedIngredientName: null,
        normalizedIngredientId: null,
      }),
    ];

    const [combinedItem] = groupCombined(items);
    expect(combinedItem.name).toBe('chicken breast');
  });

  test('regression: butter now converts to grams in grams mode instead of always staying in tablespoons', () => {
    const items = [
      makeItem({
        id: 'a',
        name: 'unsalted butter',
        quantity: '1 stick',
        normalizedIngredientId: 79,
      }),
    ];

    const [gramsResult] = groupCombined(items, true);
    expect(gramsResult.quantity).toBeCloseTo(113);
    expect(gramsResult.unit).toBe('g');

    // Imperial mode: combineNonGramsQuantity already handles butter natively
    // (its own butter branch), so density conversion isn't even needed here.
    const [imperialResult] = groupCombined(items, false);
    expect(imperialResult.quantity).toBe(8);
    expect(imperialResult.unit).toBe('tablespoon');
  });

  test('regression: butter with embedded grams in a "Tbsp; g" compound format sums the stated grams, not a tablespoon-derived approximation', () => {
    const items = [
      makeItem({
        id: 'a',
        name: 'unsalted butter, sliced into 16 Tbsp-size pieces',
        quantity: '1 cup (16 Tbsp; 226 g)',
        normalizedIngredientId: 79,
      }),
      makeItem({
        id: 'b',
        name: 'unsalted butter, room temperature',
        quantity: '¾ cup (12 tablespoon; 170 g)',
        normalizedIngredientId: 79,
      }),
      makeItem({
        id: 'c',
        name: 'unsalted butter',
        quantity: '½ cup (8 tablespoon; 113 g)',
        normalizedIngredientId: 79,
      }),
    ];

    const [gramsResult] = groupCombined(items, true);
    // 226 + 170 + 113 = 509, the recipe's own stated grams — not
    // 36 tbsp x 14.125 g/tbsp = 508.5, which is what a tablespoon-derived
    // approximation would incorrectly produce.
    expect(gramsResult.quantity).toBe(509);
    expect(gramsResult.unit).toBe('g');
  });

  test('regression: chocolate chips convert to grams in grams mode, mini chips use a denser value', () => {
    const items = [
      makeItem({
        id: 'a',
        name: 'chocolate chips',
        quantity: '1 cup',
        normalizedIngredientId: 42, // Semi-sweet chocolate chips
      }),
    ];
    const [regular] = groupCombined(items, true);
    expect(regular.quantity).toBe(170);
    expect(regular.unit).toBe('g');

    const miniItems = [
      makeItem({
        id: 'a',
        name: 'mini chocolate chips',
        quantity: '1 cup',
        normalizedIngredientId: 43, // Mini semi-sweet chocolate chips
      }),
    ];
    const [mini] = groupCombined(miniItems, true);
    expect(mini.quantity).toBe(177);
    expect(mini.unit).toBe('g');
  });
});

describe('groupByRecipe', () => {
  test('groups items under their recipe name', () => {
    const items = [
      makeItem({ id: 'a', recipeId: 'r1', recipeName: 'Recipe A' }),
      makeItem({ id: 'b', recipeId: 'r1', recipeName: 'Recipe A' }),
      makeItem({ id: 'c', recipeId: 'r2', recipeName: 'Recipe B' }),
    ];

    const groups = groupByRecipe(items);
    expect(groups).toHaveLength(2);
    const recipeA = groups.find((group) => group.recipeId === 'r1');
    expect(recipeA?.items.map((item) => item.id)).toEqual(['a', 'b']);
  });

  test('groups items with no recipeId under "Manually Added"', () => {
    const items = [
      makeItem({ id: 'a', recipeId: null, recipeName: null }),
      makeItem({ id: 'b', recipeId: null, recipeName: null }),
    ];

    const groups = groupByRecipe(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].recipeId).toBeNull();
    expect(groups[0].recipeName).toBe('Manually Added');
    expect(groups[0].items).toHaveLength(2);
  });
});
