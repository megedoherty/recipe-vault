import { createSupabaseMock } from '@/lib/actions/testUtils';

import { createClient } from '../server';
import {
  addCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from './categories';

jest.mock('../server', () => ({ createClient: jest.fn() }));

type Options = Parameters<typeof createSupabaseMock>[0];
const setup = (options?: Options) => {
  const supabase = createSupabaseMock(options);
  (createClient as jest.Mock).mockResolvedValue(supabase);
  return supabase;
};

const dbError = { message: 'boom' };

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('getCategories', () => {
  it('returns categories ordered by name', async () => {
    const rows = [{ id: 1, name: 'Dessert' }];
    const supabase = setup({ tables: { category: [{ data: rows }] } });

    await expect(getCategories()).resolves.toEqual(rows);
    expect(supabase.builders.category[0].order).toHaveBeenCalledWith('name', {
      ascending: true,
    });
  });

  it('returns [] when there is no data', async () => {
    setup({ tables: { category: [{ data: null }] } });
    await expect(getCategories()).resolves.toEqual([]);
  });
});

describe('updateCategory', () => {
  it('updates the category by id', async () => {
    const supabase = setup();
    const category = { id: 3, name: 'Soup' };

    await updateCategory(category);

    const builder = supabase.builders.category[0];
    expect(builder.update).toHaveBeenCalledWith(category);
    expect(builder.eq).toHaveBeenCalledWith('id', 3);
  });

  it('throws so the optimistic update reverts', async () => {
    setup({ tables: { category: [{ error: dbError }] } });
    await expect(updateCategory({ id: 3, name: 'Soup' })).rejects.toBe(dbError);
  });
});

describe('addCategory', () => {
  it('inserts and returns the new category', async () => {
    const created = { id: 9, name: 'Brunch' };
    const supabase = setup({ tables: { category: [{ data: created }] } });

    await expect(addCategory('Brunch')).resolves.toEqual(created);
    expect(supabase.builders.category[0].insert).toHaveBeenCalledWith({
      name: 'Brunch',
    });
  });

  it('throws the error when the insert fails', async () => {
    setup({ tables: { category: [{ error: dbError }] } });
    await expect(addCategory('Brunch')).rejects.toBe(dbError);
  });
});

describe('deleteCategory', () => {
  it('deletes by id', async () => {
    const supabase = setup();
    await deleteCategory(4);
    const builder = supabase.builders.category[0];
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 4);
  });

  it('logs but does not throw on error', async () => {
    setup({ tables: { category: [{ error: dbError }] } });
    await expect(deleteCategory(4)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(dbError);
  });
});
