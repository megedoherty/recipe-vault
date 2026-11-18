import { createSupabaseMock } from '@/lib/actions/testUtils';

import { createClient } from '../server';
import { addEquipment, getEquipment, updateEquipment } from './equipment';

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

describe('getEquipment', () => {
  it('stringifies ids and orders by name', async () => {
    const supabase = setup({
      tables: { equipment: [{ data: [{ id: 1, name: 'Whisk' }] }] },
    });

    await expect(getEquipment()).resolves.toEqual([{ id: '1', name: 'Whisk' }]);
    expect(supabase.builders.equipment[0].order).toHaveBeenCalledWith('name', {
      ascending: true,
    });
  });

  it('returns [] when there is no data', async () => {
    setup({ tables: { equipment: [{ data: null }] } });
    await expect(getEquipment()).resolves.toEqual([]);
  });
});

describe('addEquipment', () => {
  it('inserts and returns the row', async () => {
    const created = { id: 2, name: 'Bowl' };
    const supabase = setup({ tables: { equipment: [{ data: created }] } });

    await expect(addEquipment('Bowl')).resolves.toEqual(created);
    expect(supabase.builders.equipment[0].insert).toHaveBeenCalledWith({
      name: 'Bowl',
    });
  });

  it('throws when the insert fails', async () => {
    setup({ tables: { equipment: [{ error: dbError }] } });
    await expect(addEquipment('Bowl')).rejects.toBe(dbError);
  });
});

describe('updateEquipment', () => {
  it('updates the name by id', async () => {
    const supabase = setup();
    await updateEquipment(2, 'Big Bowl');
    const builder = supabase.builders.equipment[0];
    expect(builder.update).toHaveBeenCalledWith({ name: 'Big Bowl' });
    expect(builder.eq).toHaveBeenCalledWith('id', 2);
  });

  it('throws on error', async () => {
    setup({ tables: { equipment: [{ error: dbError }] } });
    await expect(updateEquipment(2, 'x')).rejects.toBe(dbError);
  });
});
