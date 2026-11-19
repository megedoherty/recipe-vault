import { fireEvent, render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';

import { getCategories } from '@/lib/supabase/queries/categories';
import { getEquipment } from '@/lib/supabase/queries/equipment';
import { getIngredientsForRecipeEdit } from '@/lib/supabase/queries/ingredients';
import { getMealTypes } from '@/lib/supabase/queries/mealTypes';
import { getOccasions } from '@/lib/supabase/queries/occasions';
import { isUserLoggedIn } from '@/lib/supabase/queries/user';

import AddRecipePage from './page';

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
// A factory avoids loading the real parser, which imports cheerio's ESM build
jest.mock('@/lib/actions/recipeParser/recipeParser', () => ({
  parseRecipeFromUrl: jest.fn(),
}));
jest.mock('@/lib/actions/recipes', () => ({
  addRecipe: jest.fn(),
  updateRecipe: jest.fn(),
}));
jest.mock('@/lib/supabase/queries/categories');
jest.mock('@/lib/supabase/queries/equipment');
jest.mock('@/lib/supabase/queries/ingredients');
jest.mock('@/lib/supabase/queries/mealTypes');
jest.mock('@/lib/supabase/queries/occasions');
jest.mock('@/lib/supabase/queries/user');
jest.mock('next/form', () => ({
  __esModule: true,
  default: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <form className={className}>{children}</form>,
}));

describe('AddRecipePage', () => {
  beforeEach(() => {
    (isUserLoggedIn as jest.Mock).mockResolvedValue(true);
    (getCategories as jest.Mock).mockResolvedValue([{ id: 1, name: 'Dinner' }]);
    (getIngredientsForRecipeEdit as jest.Mock).mockResolvedValue([]);
    (getEquipment as jest.Mock).mockResolvedValue([]);
    (getMealTypes as jest.Mock).mockResolvedValue([]);
    (getOccasions as jest.Mock).mockResolvedValue([]);
  });

  it('redirects logged-out visitors to the login page', async () => {
    (isUserLoggedIn as jest.Mock).mockResolvedValue(false);

    await expect(AddRecipePage()).rejects.toThrow('NEXT_REDIRECT:/auth/login');
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('renders the heading and add options for logged-in users', async () => {
    render(await AddRecipePage());

    expect(
      screen.getByRole('heading', { name: 'Add Recipe' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('How would you like to add a recipe?'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add from URL' }),
    ).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('gives the manual form the fetched options', async () => {
    render(await AddRecipePage());

    fireEvent.click(screen.getByRole('button', { name: 'Add Manually' }));

    expect(screen.getByText('Manual Form')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dinner' })).toBeInTheDocument();
  });
});
