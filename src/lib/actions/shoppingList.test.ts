/** @jest-environment node */
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { RecipeIngredientDisplay } from '@/types';

import {
  addCustomListToShoppingList,
  addToShoppingList,
  clearShoppingList,
  removeFromShoppingList,
  setPurchased,
} from './shoppingList';
import { createSupabaseMock, QueryResult } from './testUtils';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));

const USER = { id: 'user-1' };

const setup = (
  result: QueryResult = {},
  user: { id: string } | null = USER,
) => {
  const supabase = createSupabaseMock({
    user,
    tables: { shopping_list_item: [result] },
  });
  (createClient as jest.Mock).mockResolvedValue(supabase);
  return supabase;
};

const lastBuilder = (supabase: ReturnType<typeof createSupabaseMock>) =>
  supabase.builders.shopping_list_item[0];

const ingredient = (
  overrides: Partial<RecipeIngredientDisplay> = {},
): RecipeIngredientDisplay => ({
  id: 'i1',
  name: 'Flour',
  quantity: '2 cups',
  normalizedIngredientId: 5,
  normalizedIngredientName: 'Flour',
  category: 'Baking',
  ...overrides,
});

describe('shopping list actions', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  describe('addToShoppingList', () => {
    it('rejects an empty selection without touching the database', async () => {
      const supabase = setup();

      await expect(addToShoppingList([], 'r1', 'Pie')).resolves.toEqual({
        success: false,
        error: 'No ingredients selected',
      });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('fails when signed out', async () => {
      const supabase = setup({}, null);

      await expect(
        addToShoppingList([ingredient()], 'r1', 'Pie'),
      ).resolves.toEqual({ success: false, error: 'User not found' });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('inserts one unpurchased row per ingredient and revalidates', async () => {
      const supabase = setup();

      const result = await addToShoppingList(
        [
          ingredient(),
          ingredient({
            name: 'Sugar',
            quantity: null,
            normalizedIngredientId: null,
          }),
        ],
        'r1',
        'Pie',
      );

      expect(result).toEqual({ success: true });
      expect(supabase.from).toHaveBeenCalledWith('shopping_list_item');
      expect(lastBuilder(supabase).insert).toHaveBeenCalledWith([
        {
          user_id: 'user-1',
          recipe_id: 'r1',
          recipe_name: 'Pie',
          name: 'Flour',
          quantity: '2 cups',
          normalized_ingredient_id: 5,
          purchased: false,
        },
        {
          user_id: 'user-1',
          recipe_id: 'r1',
          recipe_name: 'Pie',
          name: 'Sugar',
          quantity: null,
          normalized_ingredient_id: null,
          purchased: false,
        },
      ]);
      expect(revalidatePath).toHaveBeenCalledWith('/shopping-list');
    });

    it('returns the database error message when the insert fails', async () => {
      setup({ error: { message: 'insert failed' } });

      await expect(
        addToShoppingList([ingredient()], 'r1', 'Pie'),
      ).resolves.toEqual({ success: false, error: 'insert failed' });
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('addCustomListToShoppingList', () => {
    it('rejects when every item name is blank', async () => {
      const supabase = setup();

      await expect(
        addCustomListToShoppingList('Party', [
          { name: '  ', quantity: '1', ingredientId: null },
        ]),
      ).resolves.toEqual({ success: false, error: 'No items to add' });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('fails when signed out', async () => {
      setup({}, null);

      await expect(
        addCustomListToShoppingList('Party', [
          { name: 'Chips', quantity: null, ingredientId: null },
        ]),
      ).resolves.toEqual({ success: false, error: 'User not found' });
    });

    it('trims values, drops blank items, and converts ingredient ids', async () => {
      const supabase = setup();

      const result = await addCustomListToShoppingList('  Party  ', [
        { name: ' Chips ', quantity: ' 2 bags ', ingredientId: '12' },
        { name: '', quantity: '1', ingredientId: null },
        { name: 'Salsa', quantity: '   ', ingredientId: null },
        { name: 'Dip', quantity: null, ingredientId: null },
      ]);

      expect(result).toEqual({ success: true });
      expect(lastBuilder(supabase).insert).toHaveBeenCalledWith([
        {
          user_id: 'user-1',
          recipe_id: null,
          recipe_name: 'Party',
          name: 'Chips',
          quantity: '2 bags',
          normalized_ingredient_id: 12,
          purchased: false,
        },
        expect.objectContaining({ name: 'Salsa', quantity: null }),
        expect.objectContaining({
          name: 'Dip',
          quantity: null,
          normalized_ingredient_id: null,
        }),
      ]);
      expect(revalidatePath).toHaveBeenCalledWith('/shopping-list');
    });

    it('uses a null list name when it is blank', async () => {
      const supabase = setup();

      await addCustomListToShoppingList('   ', [
        { name: 'Chips', quantity: null, ingredientId: null },
      ]);

      expect(lastBuilder(supabase).insert).toHaveBeenCalledWith([
        expect.objectContaining({ recipe_name: null }),
      ]);
    });

    it('returns the database error message when the insert fails', async () => {
      setup({ error: { message: 'insert failed' } });

      await expect(
        addCustomListToShoppingList('Party', [
          { name: 'Chips', quantity: null, ingredientId: null },
        ]),
      ).resolves.toEqual({ success: false, error: 'insert failed' });
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('setPurchased', () => {
    it('succeeds without a query when there are no ids', async () => {
      const supabase = setup();

      await expect(setPurchased([], true)).resolves.toEqual({ success: true });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('fails when signed out', async () => {
      setup({}, null);

      await expect(setPurchased(['a'], true)).resolves.toEqual({
        success: false,
        error: 'User not found',
      });
    });

    it("updates only the current user's matching rows", async () => {
      const supabase = setup();

      await expect(setPurchased(['a', 'b'], true)).resolves.toEqual({
        success: true,
      });

      const builder = lastBuilder(supabase);
      expect(builder.update).toHaveBeenCalledWith({ purchased: true });
      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(builder.in).toHaveBeenCalledWith('id', ['a', 'b']);
      expect(revalidatePath).toHaveBeenCalledWith('/shopping-list');
    });

    it('returns the database error message when the update fails', async () => {
      setup({ error: { message: 'update failed' } });

      await expect(setPurchased(['a'], false)).resolves.toEqual({
        success: false,
        error: 'update failed',
      });
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('removeFromShoppingList', () => {
    it('succeeds without a query when there are no ids', async () => {
      const supabase = setup();

      await expect(removeFromShoppingList([])).resolves.toEqual({
        success: true,
      });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('fails when signed out', async () => {
      setup({}, null);

      await expect(removeFromShoppingList(['a'])).resolves.toEqual({
        success: false,
        error: 'User not found',
      });
    });

    it("deletes only the current user's matching rows", async () => {
      const supabase = setup();

      await expect(removeFromShoppingList(['a', 'b'])).resolves.toEqual({
        success: true,
      });

      const builder = lastBuilder(supabase);
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(builder.in).toHaveBeenCalledWith('id', ['a', 'b']);
      expect(revalidatePath).toHaveBeenCalledWith('/shopping-list');
    });

    it('returns the database error message when the delete fails', async () => {
      setup({ error: { message: 'delete failed' } });

      await expect(removeFromShoppingList(['a'])).resolves.toEqual({
        success: false,
        error: 'delete failed',
      });
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('clearShoppingList', () => {
    it('fails when signed out', async () => {
      setup({}, null);

      await expect(clearShoppingList()).resolves.toEqual({
        success: false,
        error: 'User not found',
      });
    });

    it('deletes every row belonging to the current user', async () => {
      const supabase = setup();

      await expect(clearShoppingList()).resolves.toEqual({ success: true });

      const builder = lastBuilder(supabase);
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(builder.in).not.toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/shopping-list');
    });

    it('returns the database error message when the delete fails', async () => {
      setup({ error: { message: 'delete failed' } });

      await expect(clearShoppingList()).resolves.toEqual({
        success: false,
        error: 'delete failed',
      });
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});
