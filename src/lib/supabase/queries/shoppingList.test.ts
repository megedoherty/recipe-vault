import { createSupabaseMock } from '@/lib/actions/testUtils';

import { createClient } from '../server';
import { getShoppingListItems } from './shoppingList';

jest.mock('../server', () => ({ createClient: jest.fn() }));

const row = {
  id: 's1',
  recipe_id: 'r1',
  recipe_name: 'Cake',
  name: 'flour',
  quantity: '1 cup',
  normalized_ingredient_id: 10,
  purchased: false,
  ingredient: { name: 'All-purpose flour', category: 'Flours & Starches' },
};

const setup = (options: Parameters<typeof createSupabaseMock>[0]) => {
  const supabase = createSupabaseMock(options);
  (createClient as jest.Mock).mockResolvedValue(supabase);
  return supabase;
};

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('getShoppingListItems', () => {
  it('returns [] without querying when signed out', async () => {
    const supabase = setup({});
    await expect(getShoppingListItems()).resolves.toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("queries the current user's items oldest first and transforms them", async () => {
    const supabase = setup({
      user: { id: 'u1' },
      tables: { shopping_list_item: [{ data: [row] }] },
    });

    const result = await getShoppingListItems();

    expect(result).toEqual([
      expect.objectContaining({
        id: 's1',
        recipeId: 'r1',
        normalizedIngredientName: 'All-purpose flour',
        category: 'Flours & Starches',
      }),
    ]);
    const builder = supabase.builders.shopping_list_item[0];
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(builder.order).toHaveBeenCalledWith('created_at', {
      ascending: true,
    });
  });

  it('returns [] and logs when the query errors', async () => {
    const error = { message: 'boom' };
    setup({
      user: { id: 'u1' },
      tables: { shopping_list_item: [{ error }] },
    });
    await expect(getShoppingListItems()).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalledWith(error);
  });
});
