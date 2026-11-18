/** @jest-environment node */
import { revalidatePath } from 'next/cache';

import {
  addCategory as addCategoryQuery,
  updateCategory as updateCategoryQuery,
} from '@/lib/supabase/queries/categories';

import { addCategory, updateCategory } from './categories';
import { requireAdmin } from './requireAdmin';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('./requireAdmin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/supabase/queries/categories', () => ({
  addCategory: jest.fn(),
  updateCategory: jest.fn(),
}));

describe('category actions', () => {
  beforeEach(() => {
    (requireAdmin as jest.Mock).mockResolvedValue(undefined);
  });

  describe('addCategory', () => {
    it('trims the name, saves it, and revalidates /manage', async () => {
      const category = { id: 1, name: 'Dinner' };
      (addCategoryQuery as jest.Mock).mockResolvedValue(category);

      await expect(addCategory('  Dinner  ')).resolves.toBe(category);

      expect(addCategoryQuery).toHaveBeenCalledWith('Dinner');
      expect(revalidatePath).toHaveBeenCalledWith('/manage');
    });

    it('does nothing when the user is not an admin', async () => {
      (requireAdmin as jest.Mock).mockRejectedValue(new Error('nope'));

      await expect(addCategory('Dinner')).rejects.toThrow('nope');

      expect(addCategoryQuery).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('trims the name, saves it, and revalidates /manage', async () => {
      await updateCategory(3, '  Lunch ');

      expect(updateCategoryQuery).toHaveBeenCalledWith({
        id: 3,
        name: 'Lunch',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/manage');
    });

    it('does nothing when the user is not an admin', async () => {
      (requireAdmin as jest.Mock).mockRejectedValue(new Error('nope'));

      await expect(updateCategory(3, 'Lunch')).rejects.toThrow('nope');

      expect(updateCategoryQuery).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});
