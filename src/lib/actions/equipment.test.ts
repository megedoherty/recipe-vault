/** @jest-environment node */
import { revalidatePath } from 'next/cache';

import {
  addEquipment as addEquipmentQuery,
  updateEquipment as updateEquipmentQuery,
} from '@/lib/supabase/queries/equipment';

import { addEquipment, updateEquipment } from './equipment';
import { requireAdmin } from './requireAdmin';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('./requireAdmin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/supabase/queries/equipment', () => ({
  addEquipment: jest.fn(),
  updateEquipment: jest.fn(),
}));

describe('equipment actions', () => {
  beforeEach(() => {
    (requireAdmin as jest.Mock).mockResolvedValue(undefined);
  });

  describe('addEquipment', () => {
    it('trims the name, saves it, and revalidates /manage', async () => {
      const equipment = { id: 1, name: 'Whisk' };
      (addEquipmentQuery as jest.Mock).mockResolvedValue(equipment);

      await expect(addEquipment('  Whisk ')).resolves.toBe(equipment);

      expect(addEquipmentQuery).toHaveBeenCalledWith('Whisk');
      expect(revalidatePath).toHaveBeenCalledWith('/manage');
    });

    it('does nothing when the user is not an admin', async () => {
      (requireAdmin as jest.Mock).mockRejectedValue(new Error('nope'));

      await expect(addEquipment('Whisk')).rejects.toThrow('nope');

      expect(addEquipmentQuery).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('updateEquipment', () => {
    it('trims the name, saves it, and revalidates /manage', async () => {
      await updateEquipment(2, ' Pot  ');

      expect(updateEquipmentQuery).toHaveBeenCalledWith(2, 'Pot');
      expect(revalidatePath).toHaveBeenCalledWith('/manage');
    });

    it('does nothing when the user is not an admin', async () => {
      (requireAdmin as jest.Mock).mockRejectedValue(new Error('nope'));

      await expect(updateEquipment(2, 'Pot')).rejects.toThrow('nope');

      expect(updateEquipmentQuery).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});
