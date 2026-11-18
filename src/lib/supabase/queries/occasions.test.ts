import { createSupabaseMock } from '@/lib/actions/testUtils';

import { createClient } from '../server';
import { getOccasions } from './occasions';

jest.mock('../server', () => ({ createClient: jest.fn() }));

const setup = (data: unknown) => {
  const supabase = createSupabaseMock({ tables: { occasion: [{ data }] } });
  (createClient as jest.Mock).mockResolvedValue(supabase);
  return supabase;
};

describe('getOccasions', () => {
  it('returns rows ordered by name', async () => {
    const rows = [{ id: 1, name: 'Dinner' }];
    const supabase = setup(rows);

    await expect(getOccasions()).resolves.toEqual(rows);
    expect(supabase.builders.occasion[0].order).toHaveBeenCalledWith('name', {
      ascending: true,
    });
  });

  it('returns [] when there is no data', async () => {
    setup(null);
    await expect(getOccasions()).resolves.toEqual([]);
  });
});
