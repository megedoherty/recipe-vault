import { render, screen } from '@testing-library/react';

import { getAllRecipes } from '@/lib/supabase/queries/recipes';
import { RecipeSummary } from '@/types';

import RecipesList from './RecipesList';

// Only the data boundary and the router are mocked. RecipeCard, SortBar and
// Pagination render for real so the wiring between them is tested.
jest.mock('@/lib/supabase/queries/recipes', () => ({
  getAllRecipes: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockGetAllRecipes = getAllRecipes as jest.MockedFunction<
  typeof getAllRecipes
>;

const makeRecipes = (n: number): RecipeSummary[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `r${i}`,
    name: `Recipe ${i}`,
    imageUrl: null,
    rating: null,
    made: false,
    bookmarked: false,
  }));

const renderList = async (
  query: Record<string, string | string[] | undefined> = {},
) => render(await RecipesList({ query }));

describe('RecipesList', () => {
  beforeEach(() => {
    mockGetAllRecipes.mockReset();
  });

  it('shows a message when there are no recipes', async () => {
    mockGetAllRecipes.mockResolvedValue({ recipes: [], count: 0 });
    await renderList();

    expect(screen.getByText('No recipes found')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a card linking to each recipe', async () => {
    mockGetAllRecipes.mockResolvedValue({ recipes: makeRecipes(3), count: 3 });
    await renderList();

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(
      screen.getByRole('link', { name: 'View Recipe 0 recipe' }),
    ).toHaveAttribute('href', '/recipes/r0');
    expect(
      screen.getByRole('link', { name: 'View Recipe 2 recipe' }),
    ).toHaveAttribute('href', '/recipes/r2');
  });

  it('shows the sort bar with the recipe range and total', async () => {
    mockGetAllRecipes.mockResolvedValue({ recipes: makeRecipes(3), count: 3 });
    await renderList();

    expect(screen.getByText('1 - 3 of 3 recipes')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toBeVisible();
  });

  it('shows no pagination buttons when everything fits on one page', async () => {
    mockGetAllRecipes.mockResolvedValue({ recipes: makeRecipes(3), count: 3 });
    await renderList();

    expect(
      screen.queryByRole('button', { name: 'Next' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous' }),
    ).not.toBeInTheDocument();
  });

  it('offers Next on the first page when there are more recipes', async () => {
    // 50 recipes at 24 per page = 3 pages
    mockGetAllRecipes.mockResolvedValue({
      recipes: makeRecipes(24),
      count: 50,
    });
    await renderList();

    expect(screen.getByText('1 - 24 of 50 recipes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous' }),
    ).not.toBeInTheDocument();
  });

  it('uses the page from the query for the range and pagination', async () => {
    mockGetAllRecipes.mockResolvedValue({
      recipes: makeRecipes(24),
      count: 50,
    });
    await renderList({ page: '2' });

    expect(screen.getByText('25 - 48 of 50 recipes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous' }),
    ).toBeInTheDocument();
  });

  it('parses the query and forwards it to getAllRecipes', async () => {
    mockGetAllRecipes.mockResolvedValue({ recipes: makeRecipes(1), count: 1 });
    await renderList({
      name: 'pasta',
      categoryId: '2',
      minServings: '2',
      maxServings: '6',
      made: 'true',
      minRating: '4',
      includeAllUsers: 'true',
      sort: 'newest',
      page: '2',
    });

    expect(mockGetAllRecipes).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'pasta',
        categoryId: 2,
        minServings: 2,
        maxServings: 6,
        made: true,
        minRating: 4,
        includeAllUsers: true,
        sort: 'newest',
        page: 2,
      }),
    );
  });

  it('passes a pinBookmarked flag to getAllRecipes', async () => {
    mockGetAllRecipes.mockResolvedValue({ recipes: makeRecipes(1), count: 1 });
    await renderList();

    expect(mockGetAllRecipes).toHaveBeenCalledWith(
      expect.objectContaining({ pinBookmarked: expect.any(Boolean) }),
    );
  });
});
