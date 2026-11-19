import { fireEvent, render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';

import { getCategories } from '@/lib/supabase/queries/categories';
import { getEquipment } from '@/lib/supabase/queries/equipment';
import {
  getIngredientCategories,
  getIngredientsForManage,
} from '@/lib/supabase/queries/ingredients';
import { getUser, isAdmin } from '@/lib/supabase/queries/user';

import ManagePage from './page';

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
jest.mock('@/lib/supabase/queries/user');
jest.mock('@/lib/supabase/queries/categories');
jest.mock('@/lib/supabase/queries/equipment');
jest.mock('@/lib/supabase/queries/ingredients');
jest.mock('@/lib/actions/categories', () => ({
  addCategory: jest.fn(),
  updateCategory: jest.fn(),
}));
jest.mock('@/lib/actions/equipment', () => ({
  addEquipment: jest.fn(),
  updateEquipment: jest.fn(),
}));
jest.mock('@/lib/actions/ingredients', () => ({
  addIngredient: jest.fn(),
  updateIngredient: jest.fn(),
}));

describe('ManagePage', () => {
  beforeEach(() => {
    (getUser as jest.Mock).mockResolvedValue({ id: 'u1' });
    (isAdmin as jest.Mock).mockReturnValue(true);
    (getCategories as jest.Mock).mockResolvedValue([{ id: 1, name: 'Dinner' }]);
    (getEquipment as jest.Mock).mockResolvedValue([{ id: '7', name: 'Whisk' }]);
    (getIngredientsForManage as jest.Mock).mockResolvedValue([
      { id: '1', name: 'Flour', category: 'Baking', parentId: '' },
    ]);
    (getIngredientCategories as jest.Mock).mockResolvedValue(['Baking']);
  });

  it('redirects non-admins to the home page', async () => {
    (isAdmin as jest.Mock).mockReturnValue(false);

    await expect(ManagePage()).rejects.toThrow('NEXT_REDIRECT:/');
    expect(redirect).toHaveBeenCalledWith('/');
    expect(getCategories).not.toHaveBeenCalled();
  });

  it('checks admin status against the current user', async () => {
    const user = { id: 'u1' };
    (getUser as jest.Mock).mockResolvedValue(user);

    await ManagePage();

    expect(isAdmin).toHaveBeenCalledWith(user);
  });

  it('renders the categories tab by default', async () => {
    render(await ManagePage());

    expect(screen.getByRole('heading', { name: 'Manage' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Categories',
      'Equipment',
      'Ingredients',
    ]);
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('shows equipment with numeric ids on the equipment tab', async () => {
    render(await ManagePage());

    fireEvent.click(screen.getByRole('tab', { name: 'Equipment' }));

    expect(screen.getByText('Whisk')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add Equipment' }),
    ).toBeInTheDocument();
  });

  it('shows ingredients on the ingredients tab', async () => {
    render(await ManagePage());

    fireEvent.click(screen.getByRole('tab', { name: 'Ingredients' }));

    expect(screen.getByText('Flour')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add Ingredient' }),
    ).toBeInTheDocument();
  });
});
