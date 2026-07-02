import { IngredientForRecipeEdit } from '@/types';

import {
  parseIngredients,
  parseInstructions,
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
