/** @jest-environment node */
import { revalidatePath } from 'next/cache';

import {
  addIngredient as addIngredientQuery,
  updateIngredient as updateIngredientQuery,
} from '@/lib/supabase/queries/ingredients';

import { addIngredient, updateIngredient } from './ingredients';
import { requireAdmin } from './requireAdmin';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('./requireAdmin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/supabase/queries/ingredients', () => ({
  addIngredient: jest.fn(),
  updateIngredient: jest.fn(),
}));

// Extra fields ride along with the name, so the tests only depend on `name`
const input = (name: string) =>
  ({ name, category: 'Produce' }) as unknown as Parameters<
    typeof addIngredient
  >[0];

describe('ingredient actions', () => {
  beforeEach(() => {
    (requireAdmin as jest.Mock).mockResolvedValue(undefined);
  });

  describe('addIngredient', () => {
    it('trims the name, keeps other fields, and revalidates /manage', async () => {
      const saved = { id: '1', name: 'Basil', category: 'Produce' };
      (addIngredientQuery as jest.Mock).mockResolvedValue(saved);

      await expect(addIngredient(input('  Basil  '))).resolves.toBe(saved);

      expect(addIngredientQuery).toHaveBeenCalledWith({
        name: 'Basil',
        category: 'Produce',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/manage');
    });

    it('rejects a blank name without saving', async () => {
      await expect(addIngredient(input('   '))).rejects.toThrow(
        'Name is required',
      );

      expect(addIngredientQuery).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('does nothing when the user is not an admin', async () => {
      (requireAdmin as jest.Mock).mockRejectedValue(new Error('nope'));

      await expect(addIngredient(input('Basil'))).rejects.toThrow('nope');

      expect(addIngredientQuery).not.toHaveBeenCalled();
    });
  });

  describe('updateIngredient', () => {
    it('trims the name, saves by id, and revalidates /manage', async () => {
      await updateIngredient('7', input(' Thyme '));

      expect(updateIngredientQuery).toHaveBeenCalledWith('7', {
        name: 'Thyme',
        category: 'Produce',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/manage');
    });

    it('rejects a blank name without saving', async () => {
      await expect(updateIngredient('7', input(''))).rejects.toThrow(
        'Name is required',
      );

      expect(updateIngredientQuery).not.toHaveBeenCalled();
    });

    it('does nothing when the user is not an admin', async () => {
      (requireAdmin as jest.Mock).mockRejectedValue(new Error('nope'));

      await expect(updateIngredient('7', input('Thyme'))).rejects.toThrow(
        'nope',
      );

      expect(updateIngredientQuery).not.toHaveBeenCalled();
    });
  });
});
