/** @jest-environment node */
import { revalidatePath } from 'next/cache';

import { uploadImageFromUrl } from '@/lib/actions/images';
import { getUser } from '@/lib/supabase/queries/user';
import { createClient } from '@/lib/supabase/server';
import { InstructionSection, RecipeIngredientSectionsEditable } from '@/types';

import {
  addRecipe,
  deleteRecipe,
  toggleRecipeBookmarked,
  toggleRecipeMade,
  updateRecipe,
  updateRecipeRating,
} from './recipes';
import { createSupabaseMock, QueryResult } from './testUtils';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
// The real redirect throws to halt rendering, so mimic that
jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
jest.mock('@/lib/actions/images', () => ({ uploadImageFromUrl: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/supabase/queries/user', () => ({
  ...jest.requireActual('@/lib/supabase/queries/user'),
  getUser: jest.fn(),
}));

const SUPABASE_URL = 'https://proj.supabase.co';
const imageUrl = (file: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/recipe-images/${file}`;

const mockGetUser = getUser as jest.Mock;
const mockUpload = uploadImageFromUrl as jest.Mock;

const USER = { id: 'user-1', app_metadata: {} };
const OTHER_USER = { id: 'user-2', app_metadata: {} };
const ADMIN = { id: 'admin-1', app_metadata: { role: 'admin' } };

type Supabase = ReturnType<typeof createSupabaseMock>;

const setup = (
  tables: Record<string, QueryResult[]> = {},
  user: { id: string; app_metadata?: Record<string, unknown> } | null = USER,
) => {
  const remove = jest.fn().mockResolvedValue({ error: null });
  const supabase = createSupabaseMock({
    user,
    tables,
    storage: { from: jest.fn(() => ({ remove })) },
  });
  (createClient as jest.Mock).mockResolvedValue(supabase);
  mockGetUser.mockResolvedValue(user);
  return { supabase, remove };
};

/** The builder for `table` on which `method` was called. */
const builderFor = (supabase: Supabase, table: string, method: string) =>
  supabase.builders[table].find((b) => b[method].mock.calls.length > 0);

const redirectTo = (url: string) => `NEXT_REDIRECT:${url}`;

const makeFormData = (fields: Record<string, string> = {}) => {
  const data = new FormData();
  const all: Record<string, string> = {
    recipeName: 'Pancakes',
    sourceUrl: 'https://example.com/pancakes',
    imageUrl: '',
    categoryId: '2',
    servings: '4',
    notes: 'Serve warm',
    mealTypeId: '3',
    occasionId: '',
    'Room Temperature': '0',
    Fridge: '5',
    ...fields,
  };
  Object.entries(all).forEach(([key, value]) => data.set(key, value));
  return data;
};

const ingredientSections = (): RecipeIngredientSectionsEditable[] => [
  {
    id: 's1',
    title: 'Batter',
    ingredients: [
      {
        id: 'a',
        name: 'Flour',
        quantity: '1 cup',
        section: 'Batter',
        ingredientId: '10',
      },
      {
        id: 'b',
        name: '   ',
        quantity: null,
        section: 'Batter',
        ingredientId: null,
      },
    ],
  },
  {
    id: 's2',
    title: null,
    ingredients: [
      {
        id: 'c',
        name: 'Milk',
        quantity: null,
        section: null,
        ingredientId: null,
      },
    ],
  },
];

const instructionSections = (): InstructionSection[] => [
  {
    id: 'i1',
    title: null,
    steps: [
      { id: 'st1', text: 'Mix', ingredientIds: ['a', 'b', 'gone'] },
      { id: 'st2', text: '   ' },
    ],
  },
  { id: 'i2', title: 'Empty', steps: [{ id: 'st3', text: '' }] },
];

describe('recipe actions', () => {
  let consoleError: jest.SpyInstance;
  let originalSupabaseUrl: string | undefined;

  beforeAll(() => {
    originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  });

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockUpload.mockReset();
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  describe('addRecipe', () => {
    const run = (
      formFields: Record<string, string> = {},
      equipment: string[] = ['1', '2'],
    ) =>
      addRecipe(
        ingredientSections(),
        instructionSections(),
        equipment,
        null,
        makeFormData(formFields),
      );

    const tables = (): Record<string, QueryResult[]> => ({
      recipe: [{ data: { id: 'new-id' } }],
    });

    it('fails when signed out', async () => {
      const { supabase } = setup(tables(), null);

      await expect(run()).resolves.toEqual({
        success: false,
        error: 'User not found',
      });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('creates the recipe, ingredients and equipment, then redirects', async () => {
      const { supabase } = setup(tables());

      await expect(run()).rejects.toThrow(redirectTo('/recipes/new-id'));

      expect(
        builderFor(supabase, 'recipe', 'insert')?.insert,
      ).toHaveBeenCalledWith({
        user_id: 'user-1',
        name: 'Pancakes',
        category_id: 2,
        source_url: 'https://example.com/pancakes',
        image_url: null,
        // Empty steps/sections are dropped; links to unsaved ingredients are removed
        instructions: [
          {
            id: 'i1',
            title: null,
            steps: [{ id: 'st1', text: 'Mix', ingredientIds: ['a'] }],
          },
        ],
        ingredient_section_order: ['Batter', null],
        instruction_section_order: ['i1', 'i2'],
        servings: 4,
        // Zero-day locations are filtered out
        storage: [{ location: 'Fridge', days: 5 }],
        notes: 'Serve warm',
        meal_type_id: 3,
        occasion_id: null,
      });
      // Nameless ingredients are skipped; positions are per section
      expect(
        builderFor(supabase, 'recipe_ingredient', 'insert')?.insert,
      ).toHaveBeenCalledWith([
        {
          id: 'a',
          name: 'Flour',
          quantity: '1 cup',
          section: 'Batter',
          recipe_id: 'new-id',
          ingredient_id: 10,
          position: 0,
        },
        {
          id: 'c',
          name: 'Milk',
          quantity: null,
          section: null,
          recipe_id: 'new-id',
          ingredient_id: null,
          position: 0,
        },
      ]);
      expect(
        builderFor(supabase, 'recipe_equipment', 'insert')?.insert,
      ).toHaveBeenCalledWith([
        { recipe_id: 'new-id', equipment_id: 1 },
        { recipe_id: 'new-id', equipment_id: 2 },
      ]);
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('stores null ids for blank category and meal type, and keeps both storage locations', async () => {
      const { supabase } = setup(tables());

      await expect(
        run({
          categoryId: '',
          mealTypeId: '',
          occasionId: '9',
          'Room Temperature': '2',
        }),
      ).rejects.toThrow(redirectTo('/recipes/new-id'));

      expect(
        builderFor(supabase, 'recipe', 'insert')?.insert,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          category_id: null,
          meal_type_id: null,
          occasion_id: 9,
          storage: [
            { location: 'Room Temperature', days: 2 },
            { location: 'Fridge', days: 5 },
          ],
        }),
      );
    });

    it('returns the database error when the recipe insert fails', async () => {
      setup({ recipe: [{ error: { message: 'insert failed' } }] });

      await expect(run()).resolves.toEqual({
        success: false,
        error: 'insert failed',
      });
    });

    it('returns a default error when no recipe id comes back', async () => {
      setup({ recipe: [{ data: null }] });

      await expect(run()).resolves.toEqual({
        success: false,
        error: 'Failed to create recipe',
      });
    });

    it('returns the error when inserting ingredients fails', async () => {
      const { supabase } = setup({
        ...tables(),
        recipe_ingredient: [{ error: { message: 'ingredients failed' } }],
      });

      await expect(run()).resolves.toEqual({
        success: false,
        error: 'ingredients failed',
      });
      expect(supabase.builders.recipe_equipment).toBeUndefined();
    });

    it('returns the error when inserting equipment fails', async () => {
      setup({
        ...tables(),
        recipe_equipment: [{ error: { message: 'equipment failed' } }],
      });

      await expect(run()).resolves.toEqual({
        success: false,
        error: 'equipment failed',
      });
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('keeps an image that is already in our storage without re-uploading', async () => {
      const { supabase } = setup(tables());
      const existing = imageUrl('mine.jpg');

      await expect(run({ imageUrl: existing })).rejects.toThrow(
        redirectTo('/recipes/new-id'),
      );

      expect(
        builderFor(supabase, 'recipe', 'insert')?.insert,
      ).toHaveBeenCalledWith(expect.objectContaining({ image_url: existing }));
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('uploads an external image after saving and updates the recipe', async () => {
      const { supabase } = setup(tables());
      mockUpload.mockResolvedValue(imageUrl('uploaded.jpg'));

      await expect(
        run({ imageUrl: 'https://example.com/pic.jpg' }),
      ).rejects.toThrow(redirectTo('/recipes/new-id'));

      expect(mockUpload).toHaveBeenCalledWith(
        'https://example.com/pic.jpg',
        'new-id',
      );
      const update = builderFor(supabase, 'recipe', 'update');
      expect(update?.update).toHaveBeenCalledWith({
        image_url: imageUrl('uploaded.jpg'),
      });
      expect(update?.eq).toHaveBeenCalledWith('id', 'new-id');
    });

    it('flags an image error in the redirect when the upload fails', async () => {
      const { supabase } = setup(tables());
      mockUpload.mockResolvedValue(null);

      await expect(
        run({ imageUrl: 'https://example.com/pic.jpg' }),
      ).rejects.toThrow(redirectTo('/recipes/new-id?imageError=1'));

      expect(builderFor(supabase, 'recipe', 'update')).toBeUndefined();
    });
  });

  describe('updateRecipe', () => {
    const existing = (overrides: Record<string, unknown> = {}) => ({
      data: { image_url: null, user_id: 'user-1', ...overrides },
    });

    const tables = (
      overrides: Record<string, QueryResult[]> = {},
      current: Record<string, unknown> = {},
    ): Record<string, QueryResult[]> => ({
      recipe: [existing(current), { data: { id: 'r1' } }],
      recipe_ingredient: [{ data: [{ id: 'a' }, { id: 'old' }] }],
      ...overrides,
    });

    const run = (
      formFields: Record<string, string> = {},
      equipment: string[] = ['4'],
    ) =>
      updateRecipe(
        'r1',
        ingredientSections(),
        instructionSections(),
        equipment,
        null,
        makeFormData(formFields),
      );

    it('fails when signed out', async () => {
      const { supabase } = setup(tables(), null);

      await expect(run()).resolves.toEqual({
        success: false,
        error: 'User not found',
      });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("refuses to modify someone else's recipe", async () => {
      const { supabase } = setup(tables({}, { user_id: 'user-2' }));

      await expect(run()).resolves.toEqual({
        success: false,
        error: 'Recipe not found',
      });
      expect(builderFor(supabase, 'recipe', 'update')).toBeUndefined();
    });

    it('refuses when the recipe does not exist', async () => {
      setup(tables({ recipe: [{ data: null }] }));

      await expect(run()).resolves.toEqual({
        success: false,
        error: 'Recipe not found',
      });
    });

    it("lets an admin modify someone else's recipe", async () => {
      setup(tables({}, { user_id: 'user-2' }), ADMIN);

      await expect(run()).rejects.toThrow(redirectTo('/recipes/r1'));
    });

    it('saves the recipe, prunes and upserts ingredients, replaces equipment', async () => {
      const { supabase } = setup(tables());

      await expect(run()).rejects.toThrow(redirectTo('/recipes/r1'));

      const update = builderFor(supabase, 'recipe', 'update');
      expect(update?.update).toHaveBeenCalledWith({
        name: 'Pancakes',
        instructions: [
          {
            id: 'i1',
            title: null,
            steps: [{ id: 'st1', text: 'Mix', ingredientIds: ['a'] }],
          },
        ],
        image_url: null,
        source_url: 'https://example.com/pancakes',
        category_id: 2,
        ingredient_section_order: ['Batter'],
        instruction_section_order: ['i1', 'i2'],
        servings: 4,
        storage: [{ location: 'Fridge', days: 5 }],
        notes: 'Serve warm',
        meal_type_id: 3,
        occasion_id: null,
      });
      expect(update?.eq).toHaveBeenCalledWith('id', 'r1');

      // 'old' is no longer in the form, so it is deleted
      const del = builderFor(supabase, 'recipe_ingredient', 'delete');
      expect(del?.in).toHaveBeenCalledWith('id', ['old']);

      const upsert = builderFor(supabase, 'recipe_ingredient', 'upsert');
      expect(upsert?.upsert).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'a',
          recipe_id: 'r1',
          ingredient_id: 10,
        }),
        expect.objectContaining({
          id: 'c',
          recipe_id: 'r1',
          ingredient_id: null,
        }),
      ]);

      expect(
        builderFor(supabase, 'recipe_equipment', 'delete')?.eq,
      ).toHaveBeenCalledWith('recipe_id', 'r1');
      expect(
        builderFor(supabase, 'recipe_equipment', 'insert')?.insert,
      ).toHaveBeenCalledWith([{ recipe_id: 'r1', equipment_id: 4 }]);
    });

    it('does not delete ingredients when none were removed', async () => {
      const { supabase } = setup(
        tables({ recipe_ingredient: [{ data: [{ id: 'a' }, { id: 'c' }] }] }),
      );

      await expect(run()).rejects.toThrow(redirectTo('/recipes/r1'));

      expect(
        builderFor(supabase, 'recipe_ingredient', 'delete'),
      ).toBeUndefined();
    });

    it('treats a missing ingredient list as nothing to delete', async () => {
      const { supabase } = setup(
        tables({ recipe_ingredient: [{ data: null }] }),
      );

      await expect(run()).rejects.toThrow(redirectTo('/recipes/r1'));

      expect(
        builderFor(supabase, 'recipe_ingredient', 'delete'),
      ).toBeUndefined();
    });

    it('skips the equipment insert when none is selected', async () => {
      const { supabase } = setup(tables());

      await expect(run({}, [])).rejects.toThrow(redirectTo('/recipes/r1'));

      expect(builderFor(supabase, 'recipe_equipment', 'delete')).toBeDefined();
      expect(
        builderFor(supabase, 'recipe_equipment', 'insert'),
      ).toBeUndefined();
    });

    describe('images', () => {
      it('does not upload or touch storage when the image is unchanged', async () => {
        const current = imageUrl('same.jpg');
        const { remove } = setup(tables({}, { image_url: current }));

        await expect(run({ imageUrl: current })).rejects.toThrow(
          redirectTo('/recipes/r1'),
        );

        expect(mockUpload).not.toHaveBeenCalled();
        expect(remove).not.toHaveBeenCalled();
      });

      it('uploads a new external image and removes the previous one from storage', async () => {
        const { supabase, remove } = setup(
          tables({}, { image_url: `${imageUrl('old.jpg')}?v=1` }),
        );
        mockUpload.mockResolvedValue(imageUrl('new.jpg'));

        await expect(
          run({ imageUrl: 'https://example.com/pic.jpg' }),
        ).rejects.toThrow(redirectTo('/recipes/r1'));

        expect(mockUpload).toHaveBeenCalledWith(
          'https://example.com/pic.jpg',
          'r1',
        );
        expect(
          builderFor(supabase, 'recipe', 'update')?.update,
        ).toHaveBeenCalledWith(
          expect.objectContaining({ image_url: imageUrl('new.jpg') }),
        );
        expect(supabase.storage.from).toHaveBeenCalledWith('recipe-images');
        expect(remove).toHaveBeenCalledWith(['old.jpg']);
      });

      it('keeps the current image and flags an error when the upload fails', async () => {
        const current = imageUrl('old.jpg');
        const { supabase, remove } = setup(tables({}, { image_url: current }));
        mockUpload.mockResolvedValue(null);

        await expect(
          run({ imageUrl: 'https://example.com/pic.jpg' }),
        ).rejects.toThrow(redirectTo('/recipes/r1?imageError=1'));

        expect(
          builderFor(supabase, 'recipe', 'update')?.update,
        ).toHaveBeenCalledWith(expect.objectContaining({ image_url: current }));
        expect(remove).not.toHaveBeenCalled();
      });

      it('accepts an image URL that is already in our storage without uploading', async () => {
        const next = imageUrl('other.jpg');
        const { supabase } = setup(tables());

        await expect(run({ imageUrl: next })).rejects.toThrow(
          redirectTo('/recipes/r1'),
        );

        expect(mockUpload).not.toHaveBeenCalled();
        expect(
          builderFor(supabase, 'recipe', 'update')?.update,
        ).toHaveBeenCalledWith(expect.objectContaining({ image_url: next }));
      });

      it('removes the previous stored image when the image is cleared', async () => {
        const { supabase, remove } = setup(
          tables({}, { image_url: imageUrl('old.jpg') }),
        );

        await expect(run({ imageUrl: '' })).rejects.toThrow(
          redirectTo('/recipes/r1'),
        );

        expect(
          builderFor(supabase, 'recipe', 'update')?.update,
        ).toHaveBeenCalledWith(expect.objectContaining({ image_url: null }));
        expect(remove).toHaveBeenCalledWith(['old.jpg']);
      });

      it('does not try to remove an image that is not in our storage', async () => {
        const { remove } = setup(
          tables({}, { image_url: 'https://example.com/old.jpg' }),
        );

        await expect(run({ imageUrl: '' })).rejects.toThrow(
          redirectTo('/recipes/r1'),
        );

        expect(remove).not.toHaveBeenCalled();
      });

      it('still saves when removing the old image fails', async () => {
        const { remove } = setup(
          tables({}, { image_url: imageUrl('old.jpg') }),
        );
        remove.mockResolvedValue({ error: { message: 'gone' } });

        await expect(run({ imageUrl: '' })).rejects.toThrow(
          redirectTo('/recipes/r1'),
        );

        expect(consoleError).toHaveBeenCalledWith(
          'Error deleting old image from storage:',
          { message: 'gone' },
        );
      });
    });

    describe('errors', () => {
      it('returns the database error when the update fails', async () => {
        const { supabase } = setup(
          tables({
            recipe: [existing(), { error: { message: 'update failed' } }],
          }),
        );

        await expect(run()).resolves.toEqual({
          success: false,
          error: 'update failed',
        });
        expect(supabase.builders.recipe_equipment).toBeUndefined();
      });

      it('returns a default error when the update returns no row', async () => {
        setup(tables({ recipe: [existing(), { data: null }] }));

        await expect(run()).resolves.toEqual({
          success: false,
          error: 'Failed to update recipe',
        });
      });

      it('returns the error when deleting removed ingredients fails', async () => {
        setup(
          tables({
            recipe_ingredient: [
              { data: [{ id: 'old' }] },
              { error: { message: 'delete failed' } },
            ],
          }),
        );

        await expect(run()).resolves.toEqual({
          success: false,
          error: 'delete failed',
        });
      });

      it('returns the error when upserting ingredients fails', async () => {
        setup(
          tables({
            recipe_ingredient: [
              { data: [] },
              { error: { message: 'upsert failed' } },
            ],
          }),
        );

        await expect(run()).resolves.toEqual({
          success: false,
          error: 'upsert failed',
        });
      });

      it('returns the error when clearing equipment fails', async () => {
        setup(
          tables({
            recipe_equipment: [{ error: { message: 'clear failed' } }],
          }),
        );

        await expect(run()).resolves.toEqual({
          success: false,
          error: 'clear failed',
        });
      });

      it('returns the error when inserting equipment fails', async () => {
        setup(
          tables({
            recipe_equipment: [{}, { error: { message: 'insert failed' } }],
          }),
        );

        await expect(run()).resolves.toEqual({
          success: false,
          error: 'insert failed',
        });
      });
    });
  });

  describe('toggleRecipeMade', () => {
    const tables = (
      overrides: Record<string, QueryResult[]> = {},
    ): Record<string, QueryResult[]> => ({
      recipe: [
        { data: { image_url: null, user_id: 'user-1' } },
        { data: { id: 'r1' } },
      ],
      ...overrides,
    });

    it('throws when signed out', async () => {
      setup(tables(), null);

      await expect(toggleRecipeMade('r1', true)).rejects.toThrow(
        'User not found',
      );
    });

    it("throws for someone else's recipe", async () => {
      const { supabase } = setup(tables(), OTHER_USER);

      await expect(toggleRecipeMade('r1', true)).rejects.toThrow(
        'Recipe not found',
      );
      expect(builderFor(supabase, 'recipe', 'update')).toBeUndefined();
    });

    it('updates the made flag', async () => {
      const { supabase } = setup(tables());

      await expect(toggleRecipeMade('r1', true)).resolves.toBeUndefined();

      const update = builderFor(supabase, 'recipe', 'update');
      expect(update?.update).toHaveBeenCalledWith({ made: true });
      expect(update?.eq).toHaveBeenCalledWith('id', 'r1');
    });

    it('throws the database error message', async () => {
      setup(
        tables({
          recipe: [
            { data: { image_url: null, user_id: 'user-1' } },
            { error: { message: 'boom' } },
          ],
        }),
      );

      await expect(toggleRecipeMade('r1', false)).rejects.toThrow('boom');
    });

    it('throws a default message when nothing is returned', async () => {
      setup(
        tables({
          recipe: [
            { data: { image_url: null, user_id: 'user-1' } },
            { data: null },
          ],
        }),
      );

      await expect(toggleRecipeMade('r1', false)).rejects.toThrow(
        'Failed to toggle recipe made',
      );
    });
  });

  describe('toggleRecipeBookmarked', () => {
    it('throws when signed out', async () => {
      setup({}, null);

      await expect(toggleRecipeBookmarked('r1', true)).rejects.toThrow(
        'User not found',
      );
    });

    it("updates only the owner's recipe and revalidates the home page", async () => {
      const { supabase } = setup({ recipe: [{ data: [{ id: 'r1' }] }] });

      await expect(toggleRecipeBookmarked('r1', true)).resolves.toBeUndefined();

      const builder = supabase.builders.recipe[0];
      expect(builder.update).toHaveBeenCalledWith({ bookmarked: true });
      expect(builder.eq).toHaveBeenCalledWith('id', 'r1');
      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    it("does not let an admin bookmark someone else's recipe", async () => {
      // The user_id filter matches nothing for a non-owner, admin or not
      setup({ recipe: [{ data: [] }] }, ADMIN);

      await expect(toggleRecipeBookmarked('r1', true)).rejects.toThrow(
        'Recipe not found',
      );
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('throws when no data is returned', async () => {
      setup({ recipe: [{ data: null }] });

      await expect(toggleRecipeBookmarked('r1', true)).rejects.toThrow(
        'Recipe not found',
      );
    });

    it('throws the database error message', async () => {
      setup({ recipe: [{ error: { message: 'boom' } }] });

      await expect(toggleRecipeBookmarked('r1', true)).rejects.toThrow('boom');
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('updateRecipeRating', () => {
    const tables = (
      second: QueryResult = {},
    ): Record<string, QueryResult[]> => ({
      recipe: [{ data: { image_url: null, user_id: 'user-1' } }, second],
    });

    it.each([-1, 6, 2.5, NaN])(
      'rejects the invalid rating %p',
      async (rating) => {
        const { supabase } = setup(tables());

        await expect(updateRecipeRating('r1', rating)).rejects.toThrow(
          'Invalid rating',
        );
        expect(supabase.from).not.toHaveBeenCalled();
      },
    );

    it('throws when signed out', async () => {
      setup(tables(), null);

      await expect(updateRecipeRating('r1', 3)).rejects.toThrow(
        'User not found',
      );
    });

    it("throws for someone else's recipe", async () => {
      setup(tables(), OTHER_USER);

      await expect(updateRecipeRating('r1', 3)).rejects.toThrow(
        'Recipe not found',
      );
    });

    it.each([0, 3, 5])('saves a rating of %i', async (rating) => {
      const { supabase } = setup(tables());

      await expect(updateRecipeRating('r1', rating)).resolves.toBeUndefined();

      const update = builderFor(supabase, 'recipe', 'update');
      expect(update?.update).toHaveBeenCalledWith({ rating });
      expect(update?.eq).toHaveBeenCalledWith('id', 'r1');
    });

    it('throws the database error message', async () => {
      setup(tables({ error: { message: 'boom' } }));

      await expect(updateRecipeRating('r1', 3)).rejects.toThrow('boom');
    });
  });

  describe('deleteRecipe', () => {
    const tables = (
      deleted: QueryResult = { data: { image_url: null } },
    ): Record<string, QueryResult[]> => ({
      recipe: [{ data: { image_url: null, user_id: 'user-1' } }, deleted],
    });

    it('throws when signed out', async () => {
      setup(tables(), null);

      await expect(deleteRecipe('r1')).rejects.toThrow('User not found');
    });

    it("throws for someone else's recipe", async () => {
      const { supabase } = setup(tables(), OTHER_USER);

      await expect(deleteRecipe('r1')).rejects.toThrow('Recipe not found');
      expect(builderFor(supabase, 'recipe', 'delete')).toBeUndefined();
    });

    it('deletes the recipe and redirects home', async () => {
      const { supabase, remove } = setup(tables());

      await expect(deleteRecipe('r1')).rejects.toThrow(redirectTo('/'));

      expect(builderFor(supabase, 'recipe', 'delete')?.eq).toHaveBeenCalledWith(
        'id',
        'r1',
      );
      expect(remove).not.toHaveBeenCalled();
    });

    it('throws the database error message', async () => {
      setup(tables({ error: { message: 'boom' } }));

      await expect(deleteRecipe('r1')).rejects.toThrow('boom');
    });

    it("also removes the recipe's stored image", async () => {
      const { remove } = setup(
        tables({ data: { image_url: `${imageUrl('pic.jpg')}?t=1` } }),
      );

      await expect(deleteRecipe('r1')).rejects.toThrow(redirectTo('/'));

      expect(remove).toHaveBeenCalledWith(['pic.jpg']);
    });

    it('leaves images hosted elsewhere alone', async () => {
      const { remove } = setup(
        tables({ data: { image_url: 'https://example.com/pic.jpg' } }),
      );

      await expect(deleteRecipe('r1')).rejects.toThrow(redirectTo('/'));

      expect(remove).not.toHaveBeenCalled();
    });

    it('still redirects when removing the image fails', async () => {
      const { remove } = setup(
        tables({ data: { image_url: imageUrl('pic.jpg') } }),
      );
      remove.mockResolvedValue({ error: { message: 'gone' } });

      await expect(deleteRecipe('r1')).rejects.toThrow(redirectTo('/'));

      expect(consoleError).toHaveBeenCalledWith(
        'Error deleting image from storage:',
        { message: 'gone' },
      );
    });
  });
});
