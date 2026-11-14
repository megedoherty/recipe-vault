import { IngredientForRecipeEdit } from '@/types';

import {
  ingredientsToText,
  instructionsToText,
  parseIngredients,
  parseInstructions,
  splitCombinedIngredientLine,
  standardizeQuantity,
} from './parse';

// Reference ingredient list used to exercise findClosestIngredient (indirectly,
// since it is not exported). The ids are arbitrary numeric strings.
const referenceIngredients: IngredientForRecipeEdit[] = [
  { id: '10', name: 'all-purpose flour', category: 'baking' },
  { id: '20', name: 'granulated sugar', category: 'baking' },
  { id: '30', name: 'whole egg', category: 'dairy' },
  { id: '40', name: 'oreos', category: 'other' },
  { id: '50', name: 'unsalted butter', category: 'dairy' },
  { id: '60', name: 'table salt', category: 'other' },
];

// parseIngredients / parseInstructions assign a random crypto.randomUUID() to
// every section and item. Those ids are UI-only keys, so strip them before
// asserting to keep these characterization tests focused on behavior.
function stripIds<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (key, val) => (key === 'id' ? undefined : val)),
  );
}

describe('standardizeQuantity', () => {
  test('expands tsp to a singular/plural teaspoon based on amount', () => {
    expect(standardizeQuantity('1 tsp vanilla')).toBe('1 teaspoon vanilla');
    expect(standardizeQuantity('2 tsp')).toBe('2 teaspoons');
  });

  test('expands tbsp to a singular/plural tablespoon based on amount', () => {
    expect(standardizeQuantity('0.5 tbsp')).toBe('0.5 tablespoon');
    expect(standardizeQuantity('2 tbsp sugar')).toBe('2 tablespoons sugar');
  });

  test('removes "and" from mixed fractions', () => {
    expect(standardizeQuantity('1 and 1/2 cups flour')).toBe('1 ½ cups flour');
  });

  test('substitutes fraction glyphs', () => {
    expect(standardizeQuantity('1/2 tsp')).toBe('½ teaspoon');
  });

  test('adds a space between a number and a glued "g" unit', () => {
    expect(standardizeQuantity('12g salt')).toBe('12 g salt');
  });

  test('passes non-numeric quantity terms through as lowercase', () => {
    expect(standardizeQuantity('Pinch')).toBe('pinch');
  });
});

describe('parseIngredients', () => {
  test('returns an empty array when given no text', () => {
    expect(parseIngredients(undefined, referenceIngredients)).toEqual([]);
  });

  test('splits section headers (lines ending in a colon)', () => {
    const result = stripIds(
      parseIngredients('Cake:\n1 cup flour', referenceIngredients),
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Cake');
    expect(result[0].ingredients).toHaveLength(1);
  });

  test('puts ingredients with no header into a default section (title: null)', () => {
    const result = parseIngredients('1 cup flour', referenceIngredients);
    expect(result[0].title).toBeNull();
  });

  test('strips leading bullet/checkbox markers from ingredient lines', () => {
    const result = stripIds(
      parseIngredients('▢ 1 cup flour', referenceIngredients),
    );
    expect(result[0].ingredients[0]).toMatchObject({
      name: 'flour',
      quantity: '1 cup',
    });
  });

  test('moves an "optional:" prefix to a "(optional)" suffix', () => {
    const result = parseIngredients(
      'optional: 1 tsp salt',
      referenceIngredients,
    );
    expect(result[0].ingredients[0].name).toBe('salt (optional)');
    expect(result[0].ingredients[0].quantity).toBe('1 teaspoon');
  });

  test('treats a slash-separated metric amount like a parenthesized one', () => {
    const result = parseIngredients(
      [
        '1 ½ cups/340 grams cold unsalted butter (3 sticks), cut into ½-inch pieces',
        '¾ cup/150 grams granulated sugar',
        '½ cup plus 1 tablespoon/45 grams cocoa powder',
        '¾ cup/90 grams slivered almonds, chopped walnuts or pecans (optional)',
        '½ cup flour',
      ].join('\n'),
      referenceIngredients,
    );
    const ingredients = result[0].ingredients.map(({ name, quantity }) => ({
      name,
      quantity,
    }));
    expect(ingredients).toEqual([
      {
        name: 'cold unsalted butter (3 sticks), cut into ½-inch pieces',
        quantity: '1 ½ cups (340 grams)',
      },
      { name: 'granulated sugar', quantity: '¾ cup (150 grams)' },
      {
        name: 'cocoa powder',
        quantity: '½ cup plus 1 tablespoon (45 grams)',
      },
      {
        name: 'slivered almonds, chopped walnuts or pecans (optional)',
        quantity: '¾ cup (90 grams)',
      },
      { name: 'flour', quantity: '½ cup' },
    ]);
  });

  test('handles the egg special case (drops size, keeps count)', () => {
    const result = parseIngredients('2 large eggs', referenceIngredients);
    expect(result[0].ingredients[0]).toMatchObject({
      name: 'eggs',
      quantity: '2',
    });
  });

  test('parses ranges', () => {
    const result = parseIngredients(
      '10 - 12 oz chocolate',
      referenceIngredients,
    );
    expect(result[0].ingredients[0]).toMatchObject({
      name: 'chocolate',
      quantity: '10 - 12 oz',
    });
  });

  test('parses two quantities joined with "+"', () => {
    const result = parseIngredients(
      '1 cup + 2 tablespoons sugar',
      referenceIngredients,
    );
    expect(result[0].ingredients[0]).toMatchObject({
      name: 'sugar',
      quantity: '1 cup + 2 tablespoons',
    });
  });

  test('parses a quantity with no unit', () => {
    const result = parseIngredients('30 oreos', referenceIngredients);
    expect(result[0].ingredients[0]).toMatchObject({
      name: 'oreos',
      quantity: '30',
    });
  });

  test('normalizes "room temp" into a ", room temperature" suffix', () => {
    const result = parseIngredients(
      '1 cup unsalted butter, room temp',
      referenceIngredients,
    );
    expect(result[0].ingredients[0].name).toBe(
      'unsalted butter, room temperature',
    );
  });

  test('maps parsed names to the closest known ingredient id', () => {
    const result = parseIngredients(
      [
        '1 cup flour',
        '1 cup sugar',
        '2 eggs',
        '1 stick unsalted butter',
        '1 tsp salt',
      ].join('\n'),
      referenceIngredients,
    );
    const byName = Object.fromEntries(
      result[0].ingredients.map((i) => [i.name, i.ingredientId]),
    );
    expect(byName['flour']).toBe('10'); // startsWith('flour') special case
    expect(byName['sugar']).toBe('20'); // startsWith('sugar') special case
    expect(byName['eggs']).toBe('30'); // egg special case -> whole egg
    expect(byName['unsalted butter']).toBe('50');
    expect(byName['salt']).toBe('60'); // salt special case -> table salt
  });

  test.each([
    [
      '1 large egg + 1 egg yolk, at room temperature',
      ['1 large egg, at room temperature', '1 egg yolk, at room temperature'],
    ],
    [
      '1 large egg + 1 large yolk, at room temperature',
      [
        '1 large egg, at room temperature',
        '1 large egg yolk, at room temperature',
      ],
    ],
    ['1 large egg, plus 1 large egg yolk', ['1 large egg', '1 large egg yolk']],
  ])('splits %s', (line, expected) => {
    expect(splitCombinedIngredientLine(line)).toEqual(expected);
  });

  test.each([
    '2 teaspoons fresh chopped sage leaves, plus an extra pinch for topping',
    '3 cups (390 g) bread flour, plus more as needed',
    '3 cups plus 2 tablespoons (444 g) all-purpose flour',
    '1 cup flour, plus 2 tablespoons for dusting',
    '1 egg whisked with 1 teaspoon milk, for egg wash',
  ])('leaves %s alone', (line) => {
    expect(splitCombinedIngredientLine(line)).toEqual([line]);
  });

  test('keeps trailing words after "room temperature" intact', () => {
    const result = parseIngredients(
      '1 large egg + 1 egg yolk, room temperature preferred',
      referenceIngredients,
    );
    expect(result[0].ingredients.map((i) => i.name)).toEqual([
      'egg, room temperature preferred',
      'egg yolk, room temperature preferred',
    ]);
  });

  test('parseIngredients produces two ingredients', () => {
    const result = parseIngredients(
      '1 large egg + 1 egg yolk, at room temperature',
      referenceIngredients,
    );
    expect(result[0].ingredients).toHaveLength(2);
  });
});

describe('parseInstructions', () => {
  test('returns an empty array when given no text', () => {
    expect(parseInstructions('')).toEqual([]);
  });

  test('splits section headers (lines ending in a colon)', () => {
    const result = stripIds(parseInstructions('Bake:\nMix well.'));
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Bake');
    expect(result[0].steps).toHaveLength(1);
    expect(result[0].steps[0].text).toBe('Mix well.');
  });

  test('puts steps with no header into a default section (title: null)', () => {
    const result = parseInstructions('Mix well.');
    expect(result[0].title).toBeNull();
  });

  test('normalizes temperatures to include a degree symbol', () => {
    const result = parseInstructions('Preheat to 350F.');
    expect(result[0].steps[0].text).toBe('Preheat to 350°F.');
  });
});

describe('ingredientsToText / instructionsToText', () => {
  test('ingredientsToText writes section titles and quantity + name lines', () => {
    const text = ingredientsToText([
      {
        id: 'a',
        title: null,
        ingredients: [
          {
            id: '1',
            name: 'salt',
            quantity: null,
            section: null,
            ingredientId: null,
          },
        ],
      },
      {
        id: 'b',
        title: 'Frosting',
        ingredients: [
          {
            id: '2',
            name: 'butter',
            quantity: '1 cup',
            section: null,
            ingredientId: null,
          },
        ],
      },
    ]);
    expect(text).toBe('salt\nFrosting:\n1 cup butter');
  });

  test('instructionsToText writes section titles and step lines', () => {
    const text = instructionsToText([
      { id: 'a', title: null, steps: [{ id: '1', text: 'Mix.' }] },
      { id: 'b', title: 'Bake', steps: [{ id: '2', text: 'Bake at 350°F.' }] },
    ]);
    expect(text).toBe('Mix.\nBake:\nBake at 350°F.');
  });

  test('ingredients survive a round trip through text and back', () => {
    const original = parseIngredients(
      '2 cups all-purpose flour\n1 cup granulated sugar\nFrosting:\n1/2 cup unsalted butter',
      referenceIngredients,
    );
    const roundTripped = parseIngredients(
      ingredientsToText(original),
      referenceIngredients,
    );
    expect(stripIds(roundTripped)).toEqual(stripIds(original));
  });

  test('instructions survive a round trip through text and back', () => {
    const original = parseInstructions(
      'Preheat oven to 350 F.\nMix dry ingredients.\nFrosting:\nBeat butter.',
    );
    const roundTripped = parseInstructions(instructionsToText(original));
    expect(stripIds(roundTripped)).toEqual(stripIds(original));
  });

  test('empty input produces empty text', () => {
    expect(ingredientsToText([])).toBe('');
    expect(instructionsToText([])).toBe('');
  });
});
