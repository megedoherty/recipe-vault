import { createSupabaseMock } from '@/lib/actions/testUtils';

import { createClient } from '../server';
import { getMealTypes } from './mealTypes';

jest.mock('../server', () => ({ createClient: jest.fn() }));

const setup = (data: unknown) => {
  const supabase = createSupabaseMock({ tables: { meal_type: [{ data }] } });
  (createClient as jest.Mock).mockResolvedValue(supabase);
  return supabase;
};

describe('getMealTypes', () => {
  it('returns rows ordered by name', async () => {
    const rows = [{ id: 1, name: 'Dinner' }];
    const supabase = setup(rows);

    await expect(getMealTypes()).resolves.toEqual(rows);
    expect(supabase.builders.meal_type[0].order).toHaveBeenCalledWith('name', {
      ascending: true,
    });
  });

  it('returns [] when there is no data', async () => {
    setup(null);
    await expect(getMealTypes()).resolves.toEqual([]);
  });
});
