import { IngredientForRecipeEdit, RecipeIngredientDisplay } from '@/types';

import {
  applySwaps,
  combineIngredients,
  groupWithCategoryFirst,
  updateSwaps,
} from './shoppingListSwaps';

const line = (
  id: string,
  name: string,
  quantity: string,
  normalizedIngredientId: number | null,
  category = 'Dairy',
): RecipeIngredientDisplay => ({
  id,
  name,
  quantity,
  normalizedIngredientId,
  normalizedIngredientName: normalizedIngredientId ? name : null,
  category,
});

const oatMilk: IngredientForRecipeEdit = {
  id: '901',
  name: 'oat milk',
  category: 'Dairy',
};

describe('applySwaps', () => {
  it('replaces the ingredient but keeps the quantity and notes the original', () => {
    const [result] = applySwaps([line('1', 'milk', '1 cup', 300)], {
      '1': oatMilk,
    });

    expect(result).toMatchObject({
      name: 'oat milk (instead of milk)',
      quantity: '1 cup',
      normalizedIngredientId: 901,
      normalizedIngredientName: 'oat milk',
    });
  });

  it('leaves lines without a swap untouched', () => {
    const milk = line('1', 'milk', '1 cup', 300);
    expect(applySwaps([milk], {})).toEqual([milk]);
  });
});

describe('updateSwaps', () => {
  const originals = new Map([
    ['1', line('1', 'milk', '1 cup', 300)],
    ['2', line('2', 'milk', '2 cups', 300)],
  ]);

  it('applies the option to every given line without mutating the input', () => {
    const before = {};
    const result = updateSwaps(before, ['1', '2'], oatMilk, originals);

    expect(result).toEqual({ '1': oatMilk, '2': oatMilk });
    expect(before).toEqual({});
  });

  it('removes the swap when no option is given', () => {
    expect(updateSwaps({ '1': oatMilk }, ['1'], undefined, originals)).toEqual(
      {},
    );
  });

  it("removes the swap when the option is the line's own ingredient", () => {
    const original = { id: '300', name: 'milk', category: 'Dairy' };
    expect(updateSwaps({ '1': oatMilk }, ['1'], original, originals)).toEqual(
      {},
    );
  });
});

describe('combineIngredients', () => {
  it('combines lines with the same ingredient and sums their quantities', () => {
    const result = combineIngredients([
      line('1', 'butter', '1 cup', 300),
      line('2', 'butter', '2 cups', 300),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      ingredientId: '300',
      quantity: 3,
      unit: 'cups',
    });
    expect(result[0].sourceIngredients).toHaveLength(2);
  });

  it('sorts rows by ingredient category', () => {
    const result = combineIngredients([
      line('1', 'zucchini', '1', 400, 'Produce'),
      line('2', 'flour', '1 cup', 500, 'Flours & Starches'),
    ]);

    expect(result.map((row) => row.name)).toEqual(['flour', 'zucchini']);
  });
});

describe('groupWithCategoryFirst', () => {
  it('lists the given category first', () => {
    const groups = groupWithCategoryFirst(
      [
        { id: '1', name: 'egg', category: 'Eggs' },
        { id: '2', name: 'milk', category: 'Dairy' },
      ],
      'Dairy',
    );

    expect(groups.map((g) => g.category)).toEqual(['Dairy', 'Eggs']);
  });
});
