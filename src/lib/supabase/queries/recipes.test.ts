import { PAGE_SIZE } from '@/constants';
import { createSupabaseMock } from '@/lib/actions/testUtils';

import { createClient } from '../server';
import {
  findRecipeBySourceUrl,
  getAllRecipes,
  getRecipeForDisplay,
  getRecipeForEdit,
  getRecipeIngredientsForDisplay,
  getRecipeIngredientsForEdit,
  getServingsRange,
} from './recipes';

jest.mock('../server', () => ({ createClient: jest.fn() }));

type Options = Parameters<typeof createSupabaseMock>[0];
const setup = (options?: Options) => {
  const supabase = createSupabaseMock(options);
  (createClient as jest.Mock).mockResolvedValue(supabase);
  return supabase;
};

const recipeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'r1',
  name: 'Cake',
  image_url: 'img',
  rating: 4,
  made: true,
  bookmarked: true,
  user_id: 'u1',
  ...overrides,
});

describe('findRecipeBySourceUrl', () => {
  it("looks up the signed-in user's recipe by normalized URL", async () => {
    const supabase = setup({
      user: { id: 'u1' },
      tables: { recipe: [{ data: { id: 'r1', name: 'Cake' } }] },
    });

    await expect(
      findRecipeBySourceUrl('https://Example.com/cake/?utm_source=x#top'),
    ).resolves.toEqual({ id: 'r1', name: 'Cake' });

    const builder = supabase.builders.recipe[0];
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(builder.eq).toHaveBeenCalledWith(
      'source_url',
      'https://example.com/cake',
    );
  });

  it('returns null when there is no match', async () => {
    setup({ user: { id: 'u1' }, tables: { recipe: [{ data: null }] } });

    await expect(
      findRecipeBySourceUrl('https://example.com/cake'),
    ).resolves.toBeNull();
  });

  it('returns null without querying for a blank URL or signed-out user', async () => {
    const supabase = setup({ user: { id: 'u1' } });
    await expect(findRecipeBySourceUrl('  ')).resolves.toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();

    const signedOut = setup({ user: null });
    await expect(
      findRecipeBySourceUrl('https://example.com/cake'),
    ).resolves.toBeNull();
    expect(signedOut.from).not.toHaveBeenCalled();
  });
});

describe('getRecipeForDisplay', () => {
  it('transforms the recipe row', async () => {
    const supabase = setup({
      tables: {
        recipe: [
          {
            data: {
              user_id: 'u1',
              name: 'Cake',
              made: false,
              bookmarked: false,
              image_url: null,
              source_url: null,
              instructions: [],
              instruction_section_order: null,
              category: { name: 'Dessert' },
              rating: null,
              recipe_equipment: [],
              servings: 4,
              storage: [],
              notes: null,
              meal_type: null,
              occasion: null,
            },
          },
        ],
      },
    });

    const result = await getRecipeForDisplay('r1');

    expect(result).toMatchObject({ name: 'Cake', category: 'Dessert' });
    expect(supabase.builders.recipe[0].eq).toHaveBeenCalledWith('id', 'r1');
  });

  it('returns null when not found', async () => {
    setup({ tables: { recipe: [{ data: null }] } });
    await expect(getRecipeForDisplay('missing')).resolves.toBeNull();
  });
});

describe('getRecipeForEdit', () => {
  it('transforms the recipe row for editing', async () => {
    setup({
      tables: {
        recipe: [
          {
            data: {
              user_id: 'u1',
              name: 'Cake',
              image_url: null,
              source_url: null,
              instructions: [],
              instruction_section_order: null,
              category_id: 2,
              ingredient_section_order: null,
              recipe_equipment: [{ equipment_id: 5 }],
              servings: 4,
              storage: [],
              notes: null,
              meal_type_id: null,
              occasion_id: null,
            },
          },
        ],
      },
    });

    await expect(getRecipeForEdit('r1')).resolves.toMatchObject({
      name: 'Cake',
      categoryId: 2,
      equipmentIds: ['5'],
    });
  });

  it('returns null when not found', async () => {
    setup({ tables: { recipe: [{ data: null }] } });
    await expect(getRecipeForEdit('missing')).resolves.toBeNull();
  });
});

describe('getRecipeIngredientsForDisplay', () => {
  const ingredient = (id: string, section: string, position: number) => ({
    id,
    name: id,
    quantity: null,
    position,
    section,
    ingredient_id: null,
    ingredient: null,
  });

  it("groups ingredients and applies the recipe's section order", async () => {
    const supabase = setup({
      tables: {
        recipe_ingredient: [
          {
            data: [ingredient('a', 'Main', 0), ingredient('b', 'Glaze', 1)],
          },
        ],
        recipe: [{ data: { ingredient_section_order: ['Glaze', 'Main'] } }],
      },
    });

    const result = await getRecipeIngredientsForDisplay('r1');

    expect(result.map((s) => s.title)).toEqual(['Glaze', 'Main']);
    expect(supabase.builders.recipe_ingredient[0].eq).toHaveBeenCalledWith(
      'recipe_id',
      'r1',
    );
  });

  it('keeps position order when the recipe row is missing', async () => {
    setup({
      tables: {
        recipe_ingredient: [
          { data: [ingredient('a', 'Main', 0), ingredient('b', 'Glaze', 1)] },
        ],
        recipe: [{ data: null }],
      },
    });

    const result = await getRecipeIngredientsForDisplay('r1');
    expect(result.map((s) => s.title)).toEqual(['Main', 'Glaze']);
  });

  it('returns [] when there are no ingredients', async () => {
    setup({
      tables: { recipe_ingredient: [{ data: null }], recipe: [{ data: null }] },
    });
    await expect(getRecipeIngredientsForDisplay('r1')).resolves.toEqual([]);
  });
});

describe('getRecipeIngredientsForEdit', () => {
  it('groups editable ingredients with the recipe section order', async () => {
    setup({
      tables: {
        recipe_ingredient: [
          {
            data: [
              {
                id: 'a',
                name: 'flour',
                quantity: '1',
                position: 0,
                section: 'Main',
                ingredient_id: 3,
              },
              {
                id: 'b',
                name: 'sugar',
                quantity: '2',
                position: 1,
                section: 'Glaze',
                ingredient_id: null,
              },
            ],
          },
        ],
        recipe: [{ data: { ingredient_section_order: ['Glaze', 'Main'] } }],
      },
    });

    const result = await getRecipeIngredientsForEdit('r1');

    expect(result.map((s) => s.title)).toEqual(['Glaze', 'Main']);
    expect(result[1].ingredients[0].ingredientId).toBe('3');
  });

  it('returns [] when there are no ingredients', async () => {
    setup({
      tables: { recipe_ingredient: [{ data: null }], recipe: [{ data: null }] },
    });
    await expect(getRecipeIngredientsForEdit('r1')).resolves.toEqual([]);
  });
});

describe('getAllRecipes', () => {
  const recipeBuilder = (supabase: ReturnType<typeof setup>) =>
    supabase.builders.recipe[0];

  describe('mapping', () => {
    it('maps rows and the total count', async () => {
      setup({
        user: { id: 'u1' },
        tables: { recipe: [{ data: [recipeRow()], count: 12 }] },
      });

      await expect(getAllRecipes()).resolves.toEqual({
        recipes: [
          {
            id: 'r1',
            name: 'Cake',
            imageUrl: 'img',
            rating: 4,
            made: true,
            bookmarked: true,
          },
        ],
        count: 12,
      });
    });

    it("never shows the bookmark flag on someone else's recipe", async () => {
      setup({
        user: { id: 'u1' },
        tables: {
          recipe: [{ data: [recipeRow({ user_id: 'other' })], count: 1 }],
        },
      });

      const { recipes } = await getAllRecipes({ includeAllUsers: true });
      expect(recipes[0].bookmarked).toBe(false);
    });

    it('treats a null count as 0', async () => {
      setup({ tables: { recipe: [{ data: [], count: null }] } });
      await expect(getAllRecipes()).resolves.toEqual({
        recipes: [],
        count: 0,
      });
    });

    it('returns the empty result when there is no data', async () => {
      setup({ tables: { recipe: [{ data: null }] } });
      await expect(getAllRecipes()).resolves.toEqual({
        recipes: [],
        count: 0,
      });
    });
  });

  describe('user scoping', () => {
    it("scopes to the current user's recipes by default", async () => {
      const supabase = setup({ user: { id: 'u1' } });
      await getAllRecipes();
      expect(recipeBuilder(supabase).eq).toHaveBeenCalledWith('user_id', 'u1');
    });

    it('does not scope with includeAllUsers', async () => {
      const supabase = setup({ user: { id: 'u1' } });
      await getAllRecipes({ includeAllUsers: true });
      expect(recipeBuilder(supabase).eq).not.toHaveBeenCalledWith(
        'user_id',
        expect.anything(),
      );
    });

    it('does not scope when signed out', async () => {
      const supabase = setup();
      await getAllRecipes();
      expect(recipeBuilder(supabase).eq).not.toHaveBeenCalled();
    });
  });

  describe('bookmarks', () => {
    it('filters to the user’s bookmarks even with includeAllUsers', async () => {
      const supabase = setup({ user: { id: 'u1' } });
      await getAllRecipes({ bookmarked: true, includeAllUsers: true });
      const { eq } = recipeBuilder(supabase);
      expect(eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(eq).toHaveBeenCalledWith('bookmarked', true);
    });

    it('returns empty for signed-out visitors without querying results', async () => {
      const supabase = setup();
      await expect(getAllRecipes({ bookmarked: true })).resolves.toEqual({
        recipes: [],
        count: 0,
      });
      expect(recipeBuilder(supabase).range).not.toHaveBeenCalled();
    });

    it('orders bookmarked recipes first when pinning', async () => {
      const supabase = setup();
      await getAllRecipes({ pinBookmarked: true });
      expect(recipeBuilder(supabase).order.mock.calls[0]).toEqual([
        'bookmarked',
        { ascending: false },
      ]);
      expect(recipeBuilder(supabase).order).toHaveBeenCalledTimes(2);
    });
  });

  describe('sorting', () => {
    it.each([
      ['last_updated', 'updated_at', false],
      ['name_asc', 'name', true],
      ['newest', 'created_at', false],
      ['oldest', 'created_at', true],
    ] as const)('sort=%s orders by %s', async (sort, column, ascending) => {
      const supabase = setup();
      await getAllRecipes({ sort });
      expect(recipeBuilder(supabase).order).toHaveBeenCalledWith(column, {
        ascending,
      });
    });

    it('defaults to last_updated', async () => {
      const supabase = setup();
      await getAllRecipes();
      expect(recipeBuilder(supabase).order).toHaveBeenCalledWith('updated_at', {
        ascending: false,
      });
    });
  });

  describe('simple filters', () => {
    it('applies each provided filter', async () => {
      const supabase = setup();
      await getAllRecipes({
        name: 'pie',
        categoryId: 2,
        minServings: 2,
        maxServings: 8,
        made: false,
        minRating: 3,
        mealTypeId: 4,
        occasionId: 5,
      });

      const b = recipeBuilder(supabase);
      expect(b.ilike).toHaveBeenCalledWith('name', '%pie%');
      expect(b.eq).toHaveBeenCalledWith('category_id', 2);
      expect(b.gte).toHaveBeenCalledWith('servings', 2);
      expect(b.lte).toHaveBeenCalledWith('servings', 8);
      expect(b.eq).toHaveBeenCalledWith('made', false);
      expect(b.gte).toHaveBeenCalledWith('rating', 3);
      expect(b.eq).toHaveBeenCalledWith('meal_type_id', 4);
      expect(b.eq).toHaveBeenCalledWith('occasion_id', 5);
    });

    it('applies no filters by default', async () => {
      const supabase = setup();
      await getAllRecipes();
      const b = recipeBuilder(supabase);
      expect(b.ilike).not.toHaveBeenCalled();
      expect(b.gte).not.toHaveBeenCalled();
      expect(b.lte).not.toHaveBeenCalled();
      expect(b.in).not.toHaveBeenCalled();
      expect(b.not).not.toHaveBeenCalled();
    });

    it('filters on made=true as well as false', async () => {
      const supabase = setup();
      await getAllRecipes({ made: true });
      expect(recipeBuilder(supabase).eq).toHaveBeenCalledWith('made', true);
    });
  });

  describe('pagination', () => {
    it('requests the first page by default', async () => {
      const supabase = setup();
      await getAllRecipes();
      expect(recipeBuilder(supabase).range).toHaveBeenCalledWith(
        0,
        PAGE_SIZE - 1,
      );
    });

    it('offsets later pages', async () => {
      const supabase = setup();
      await getAllRecipes({ page: 3 });
      expect(recipeBuilder(supabase).range).toHaveBeenCalledWith(
        2 * PAGE_SIZE,
        3 * PAGE_SIZE - 1,
      );
    });
  });

  describe('ingredient filters', () => {
    const rows = (...pairs: [string, number][]) =>
      pairs.map(([recipe_id, ingredient_id]) => ({ recipe_id, ingredient_id }));

    it('includes only recipes that have ALL the ingredients', async () => {
      const supabase = setup({
        tables: {
          recipe_ingredient: [
            {
              data: rows(['r1', 1], ['r1', 2], ['r2', 1], ['r3', 1], ['r3', 2]),
            },
          ],
        },
      });

      await getAllRecipes({ includeIngredients: '1,2' });

      expect(supabase.builders.recipe_ingredient[0].in).toHaveBeenCalledWith(
        'ingredient_id',
        [1, 2],
      );
      expect(recipeBuilder(supabase).in).toHaveBeenCalledWith('id', [
        'r1',
        'r3',
      ]);
    });

    it('returns empty when no recipe has all included ingredients', async () => {
      const supabase = setup({
        tables: {
          recipe_ingredient: [{ data: rows(['r1', 1], ['r2', 2]) }],
        },
      });

      await expect(
        getAllRecipes({ includeIngredients: '1,2' }),
      ).resolves.toEqual({ recipes: [], count: 0 });
      expect(recipeBuilder(supabase).range).not.toHaveBeenCalled();
    });

    it('returns empty when no recipe has any included ingredient', async () => {
      setup({ tables: { recipe_ingredient: [{ data: [] }] } });
      await expect(getAllRecipes({ includeIngredients: '1' })).resolves.toEqual(
        { recipes: [], count: 0 },
      );
    });

    it('excludes recipes that have any excluded ingredient', async () => {
      const supabase = setup({
        tables: {
          recipe_ingredient: [
            {
              data: [
                { recipe_id: 'r1' },
                { recipe_id: 'r1' },
                { recipe_id: 'r2' },
              ],
            },
          ],
        },
      });

      await getAllRecipes({ excludeIngredients: '5,6' });

      expect(supabase.builders.recipe_ingredient[0].in).toHaveBeenCalledWith(
        'ingredient_id',
        [5, 6],
      );
      expect(recipeBuilder(supabase).not).toHaveBeenCalledWith(
        'id',
        'in',
        '(r1,r2)',
      );
    });

    it('does not filter when nothing matches the excluded ingredients', async () => {
      const supabase = setup({
        tables: { recipe_ingredient: [{ data: [] }] },
      });
      await getAllRecipes({ excludeIngredients: '5' });
      expect(recipeBuilder(supabase).not).not.toHaveBeenCalled();
      expect(recipeBuilder(supabase).range).toHaveBeenCalled();
    });

    it('removes excluded recipes from the included set', async () => {
      const supabase = setup({
        tables: {
          recipe_ingredient: [
            { data: rows(['r1', 1], ['r2', 1]) },
            { data: [{ recipe_id: 'r2' }] },
          ],
        },
      });

      await getAllRecipes({ includeIngredients: '1', excludeIngredients: '9' });

      expect(recipeBuilder(supabase).in).toHaveBeenCalledWith('id', ['r1']);
    });

    it('returns empty when exclusions remove every included recipe', async () => {
      setup({
        tables: {
          recipe_ingredient: [
            { data: rows(['r1', 1]) },
            { data: [{ recipe_id: 'r1' }] },
          ],
        },
      });

      await expect(
        getAllRecipes({ includeIngredients: '1', excludeIngredients: '9' }),
      ).resolves.toEqual({ recipes: [], count: 0 });
    });
  });

  describe('equipment filter', () => {
    const rows = (...pairs: [string, number][]) =>
      pairs.map(([recipe_id, equipment_id]) => ({ recipe_id, equipment_id }));

    it('includes only recipes that have ALL the equipment', async () => {
      const supabase = setup({
        tables: {
          recipe_equipment: [{ data: rows(['r1', 1], ['r1', 2], ['r2', 1]) }],
        },
      });

      await getAllRecipes({ equipment: '1,2' });

      expect(supabase.builders.recipe_equipment[0].in).toHaveBeenCalledWith(
        'equipment_id',
        [1, 2],
      );
      expect(recipeBuilder(supabase).in).toHaveBeenCalledWith('id', ['r1']);
    });

    it('returns empty when no recipe has all the equipment', async () => {
      setup({
        tables: {
          recipe_equipment: [{ data: rows(['r1', 1], ['r2', 2]) }],
        },
      });
      await expect(getAllRecipes({ equipment: '1,2' })).resolves.toEqual({
        recipes: [],
        count: 0,
      });
    });

    it('returns empty when no recipe has any of the equipment', async () => {
      setup({ tables: { recipe_equipment: [{ data: null }] } });
      await expect(getAllRecipes({ equipment: '1' })).resolves.toEqual({
        recipes: [],
        count: 0,
      });
    });

    it('intersects with the ingredient filter', async () => {
      const supabase = setup({
        tables: {
          recipe_ingredient: [
            {
              data: [
                { recipe_id: 'r1', ingredient_id: 1 },
                { recipe_id: 'r2', ingredient_id: 1 },
              ],
            },
          ],
          recipe_equipment: [{ data: rows(['r2', 7], ['r3', 7]) }],
        },
      });

      await getAllRecipes({ includeIngredients: '1', equipment: '7' });

      expect(recipeBuilder(supabase).in).toHaveBeenCalledWith('id', ['r2']);
    });

    it('returns empty when the ingredient and equipment filters do not overlap', async () => {
      setup({
        tables: {
          recipe_ingredient: [
            { data: [{ recipe_id: 'r1', ingredient_id: 1 }] },
          ],
          recipe_equipment: [{ data: rows(['r2', 7]) }],
        },
      });

      await expect(
        getAllRecipes({ includeIngredients: '1', equipment: '7' }),
      ).resolves.toEqual({ recipes: [], count: 0 });
    });
  });
});

describe('getServingsRange', () => {
  it('returns the min and max servings', async () => {
    const supabase = setup({
      tables: {
        recipe: [{ data: { servings: 2 } }, { data: { servings: 24 } }],
      },
    });

    await expect(getServingsRange()).resolves.toEqual({ min: 2, max: 24 });
    expect(supabase.builders.recipe[0].order).toHaveBeenCalledWith('servings', {
      ascending: true,
    });
    expect(supabase.builders.recipe[1].order).toHaveBeenCalledWith('servings', {
      ascending: false,
    });
  });

  it('returns zeros when there are no recipes with servings', async () => {
    setup({ tables: { recipe: [{ data: null }] } });
    await expect(getServingsRange()).resolves.toEqual({ min: 0, max: 0 });
  });

  it('treats null servings as 0', async () => {
    setup({
      tables: {
        recipe: [{ data: { servings: null } }, { data: { servings: null } }],
      },
    });
    await expect(getServingsRange()).resolves.toEqual({ min: 0, max: 0 });
  });
});
