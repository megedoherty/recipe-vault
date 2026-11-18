import { createSupabaseMock } from '@/lib/actions/testUtils';

import { createClient } from '../server';
import {
  addIngredient,
  getIngredientCategories,
  getIngredientsForManage,
  getIngredientsForRecipeEdit,
  getIngredientsForSearch,
  updateIngredient,
} from './ingredients';

jest.mock('../server', () => ({ createClient: jest.fn() }));

type Options = Parameters<typeof createSupabaseMock>[0];
const setup = (options?: Options) => {
  const supabase = createSupabaseMock(options);
  (createClient as jest.Mock).mockResolvedValue(supabase);
  return supabase;
};
const withIngredients = (data: unknown) =>
  setup({ tables: { ingredient: [{ data }] } });

const makeRow = (
  id: number,
  name: string,
  parent_id: number | null = null,
  category = 'Other',
) => ({ id, name, category, parent_id });

const dbError = { message: 'boom' };

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('getIngredientsForRecipeEdit', () => {
  it('drops ingredients that are parents of others', async () => {
    withIngredients([
      makeRow(1, 'Sugar'),
      makeRow(2, 'Granulated Sugar', 1),
      makeRow(3, 'Salt'),
    ]);

    const result = await getIngredientsForRecipeEdit();

    expect(result.map((i) => i.name).sort()).toEqual([
      'Granulated Sugar',
      'Salt',
    ]);
  });

  it('stringifies ids and sorts priority categories first', async () => {
    withIngredients([
      makeRow(1, 'Basil', null, 'Herbs'),
      makeRow(2, 'Flour', null, 'Flours & Starches'),
    ]);

    await expect(getIngredientsForRecipeEdit()).resolves.toEqual([
      { id: '2', name: 'Flour', category: 'Flours & Starches' },
      { id: '1', name: 'Basil', category: 'Herbs' },
    ]);
  });

  it('returns [] and logs when there is no data', async () => {
    withIngredients(null);
    await expect(getIngredientsForRecipeEdit()).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalledWith('No ingredients found');
  });
});

describe('getIngredientsForSearch', () => {
  it('returns [] and logs when there is no data', async () => {
    withIngredients(null);
    await expect(getIngredientsForSearch()).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalledWith('No ingredients found');
  });

  it('returns flat roots with empty relations', async () => {
    withIngredients([makeRow(1, 'Salt'), makeRow(2, 'Pepper')]);

    const result = await getIngredientsForSearch();

    expect(result).toEqual([
      {
        id: '2',
        name: 'Pepper',
        category: 'Other',
        childrenIds: [],
        parentIds: [],
        depth: 0,
      },
      {
        id: '1',
        name: 'Salt',
        category: 'Other',
        childrenIds: [],
        parentIds: [],
        depth: 0,
      },
    ]);
  });

  it('nests children after their parent with depth, ancestors and all descendants', async () => {
    withIngredients([
      makeRow(3, 'Brown Sugar', 2),
      makeRow(1, 'Salt'),
      makeRow(2, 'Sugar'),
      makeRow(4, 'Dark Brown Sugar', 3),
    ]);

    const result = await getIngredientsForSearch();

    expect(result.map((i) => [i.name, i.depth])).toEqual([
      ['Salt', 0],
      ['Sugar', 0],
      ['Brown Sugar', 1],
      ['Dark Brown Sugar', 2],
    ]);
    const byName = Object.fromEntries(result.map((i) => [i.name, i]));
    expect(byName.Sugar.childrenIds.sort()).toEqual(['3', '4']);
    expect(byName['Brown Sugar'].childrenIds).toEqual(['4']);
    expect(byName['Brown Sugar'].parentIds).toEqual(['2']);
    expect(byName['Dark Brown Sugar'].parentIds).toEqual(['2', '3']);
    expect(byName['Dark Brown Sugar'].childrenIds).toEqual([]);
  });
});

describe('getIngredientsForManage', () => {
  it('maps rows, using an empty parentId for roots, ordered by name', async () => {
    const supabase = withIngredients([
      makeRow(1, 'Sugar'),
      makeRow(2, 'Brown Sugar', 1),
    ]);

    await expect(getIngredientsForManage()).resolves.toEqual([
      { id: '1', name: 'Sugar', category: 'Other', parentId: '' },
      { id: '2', name: 'Brown Sugar', category: 'Other', parentId: '1' },
    ]);
    expect(supabase.builders.ingredient[0].order).toHaveBeenCalledWith('name', {
      ascending: true,
    });
  });

  it('returns [] when there is no data', async () => {
    withIngredients(null);
    await expect(getIngredientsForManage()).resolves.toEqual([]);
  });
});

describe('addIngredient', () => {
  it('inserts with a numeric parent_id and returns the mapped row', async () => {
    const supabase = withIngredients(makeRow(5, 'Brown Sugar', 1, 'Sugars'));

    const result = await addIngredient({
      name: 'Brown Sugar',
      category: 'Sugars',
      parentId: '1',
    });

    expect(result).toEqual({
      id: '5',
      name: 'Brown Sugar',
      category: 'Sugars',
      parentId: '1',
    });
    expect(supabase.builders.ingredient[0].insert).toHaveBeenCalledWith({
      name: 'Brown Sugar',
      category: 'Sugars',
      parent_id: 1,
    });
  });

  it('inserts a null parent_id for a root ingredient', async () => {
    const supabase = withIngredients(makeRow(5, 'Salt'));
    await addIngredient({ name: 'Salt', category: 'Other', parentId: '' });
    expect(supabase.builders.ingredient[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ parent_id: null }),
    );
  });

  it('throws when the insert fails', async () => {
    setup({ tables: { ingredient: [{ error: dbError }] } });
    await expect(
      addIngredient({ name: 'x', category: 'y', parentId: '' }),
    ).rejects.toBe(dbError);
  });
});

describe('updateIngredient', () => {
  const input = { name: 'Sugar', category: 'Sweeteners', parentId: '' };

  it('updates by numeric id without a cycle check for roots', async () => {
    const supabase = setup();

    await updateIngredient('7', input);

    expect(supabase.builders.ingredient).toHaveLength(1);
    const builder = supabase.builders.ingredient[0];
    expect(builder.update).toHaveBeenCalledWith({
      name: 'Sugar',
      category: 'Sweeteners',
      parent_id: null,
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 7);
  });

  it('allows moving under an unrelated parent', async () => {
    const supabase = setup({
      tables: {
        ingredient: [
          { data: [makeRow(1, 'A'), makeRow(2, 'B', 1), makeRow(7, 'C')] },
          {},
        ],
      },
    });

    await updateIngredient('7', { ...input, parentId: '2' });

    expect(supabase.builders.ingredient[1].update).toHaveBeenCalledWith(
      expect.objectContaining({ parent_id: 2 }),
    );
  });

  it('rejects making an ingredient its own parent', async () => {
    setup({ tables: { ingredient: [{ data: [makeRow(7, 'C')] }] } });
    await expect(
      updateIngredient('7', { ...input, parentId: '7' }),
    ).rejects.toThrow('cannot be its own ancestor');
  });

  it('rejects making an ingredient a child of its descendant', async () => {
    const supabase = setup({
      tables: {
        ingredient: [
          { data: [makeRow(7, 'C'), makeRow(8, 'D', 7), makeRow(9, 'E', 8)] },
        ],
      },
    });

    await expect(
      updateIngredient('7', { ...input, parentId: '9' }),
    ).rejects.toThrow('cannot be its own ancestor');
    // never reached the update
    expect(supabase.builders.ingredient).toHaveLength(1);
  });

  it('throws when the update fails', async () => {
    setup({ tables: { ingredient: [{ error: dbError }] } });
    await expect(updateIngredient('7', input)).rejects.toBe(dbError);
  });
});

describe('getIngredientCategories', () => {
  it('returns unique categories, sorted', async () => {
    withIngredients([
      { category: 'Spices' },
      { category: 'Dairy' },
      { category: 'Spices' },
    ]);
    await expect(getIngredientCategories()).resolves.toEqual([
      'Dairy',
      'Spices',
    ]);
  });

  it('returns [] when there is no data', async () => {
    withIngredients(null);
    await expect(getIngredientCategories()).resolves.toEqual([]);
  });
});
