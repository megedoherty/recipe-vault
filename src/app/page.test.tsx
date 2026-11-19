import { render, screen } from '@testing-library/react';

import { getCategories } from '@/lib/supabase/queries/categories';
import { getEquipment } from '@/lib/supabase/queries/equipment';
import { getIngredientsForSearch } from '@/lib/supabase/queries/ingredients';
import { getMealTypes } from '@/lib/supabase/queries/mealTypes';
import { getOccasions } from '@/lib/supabase/queries/occasions';
import { getServingsRange } from '@/lib/supabase/queries/recipes';

import Home, { metadata } from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('@/lib/supabase/queries/categories');
jest.mock('@/lib/supabase/queries/equipment');
jest.mock('@/lib/supabase/queries/ingredients');
jest.mock('@/lib/supabase/queries/mealTypes');
jest.mock('@/lib/supabase/queries/occasions');
jest.mock('@/lib/supabase/queries/recipes');

// RecipesList is an async server component that fetches its own data, which
// can't be rendered synchronously in jsdom. Stub it to expose the query it gets.
jest.mock('./components/RecipesList/RecipesList', () => ({
  __esModule: true,
  default: ({ query }: { query: unknown }) => (
    <div data-testid="recipes-list">{JSON.stringify(query)}</div>
  ),
}));

describe('Home page', () => {
  beforeEach(() => {
    (getCategories as jest.Mock).mockResolvedValue([{ id: 1, name: 'Dinner' }]);
    (getIngredientsForSearch as jest.Mock).mockResolvedValue([]);
    (getEquipment as jest.Mock).mockResolvedValue([]);
    (getMealTypes as jest.Mock).mockResolvedValue([
      { id: 10, name: 'Breakfast' },
    ]);
    (getServingsRange as jest.Mock).mockResolvedValue({ min: 1, max: 12 });
    (getOccasions as jest.Mock).mockResolvedValue([]);
  });

  it('renders the heading and a search form populated with the fetched options', async () => {
    render(await Home({ searchParams: Promise.resolve({}) } as never));

    expect(
      screen.getByRole('heading', { name: 'Recipes' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Recipe name')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dinner' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Breakfast' }),
    ).toBeInTheDocument();
  });

  it('passes the URL search params to the recipes list', async () => {
    render(
      await Home({
        searchParams: Promise.resolve({ name: 'soup', page: '2' }),
      } as never),
    );

    expect(screen.getByTestId('recipes-list')).toHaveTextContent(
      '{"name":"soup","page":"2"}',
    );
  });

  it('sets the page title', () => {
    expect(metadata.title).toBe('All Recipes | Recipe Vault');
  });
});
