import { render, screen } from '@testing-library/react';

import ToastProvider from '@/components/molecules/Toast/ToastProvider';
import { getIngredientsForRecipeEdit } from '@/lib/supabase/queries/ingredients';
import {
  getRecipeForDisplay,
  getRecipeIngredientsForDisplay,
} from '@/lib/supabase/queries/recipes';
import { canModifyRecipe, getUser } from '@/lib/supabase/queries/user';
import { RecipeDisplay } from '@/types';

import RecipePage, { generateMetadata } from './page';

jest.mock('@/lib/supabase/queries/ingredients');
jest.mock('@/lib/supabase/queries/recipes');
jest.mock('@/lib/supabase/queries/user');

// Server actions are the boundary to the database
jest.mock('@/lib/actions/recipes', () => ({
  toggleRecipeBookmarked: jest.fn(),
  toggleRecipeMade: jest.fn(),
  updateRecipeRating: jest.fn(),
  deleteRecipe: jest.fn(),
}));
jest.mock('@/lib/actions/shoppingList', () => ({
  addToShoppingList: jest.fn(),
}));

let query = '';
const replace = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => '/recipes/r1',
  useRouter: () => ({ replace, push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(query),
}));

const recipe: RecipeDisplay = {
  userId: 'owner',
  name: 'Banana Bread',
  made: true,
  bookmarked: true,
  imageUrl: null,
  sourceUrl: 'https://example.com/banana',
  instructions: [
    {
      id: 's1',
      title: null,
      steps: [{ id: 'a', text: 'Mash bananas', ingredientIds: ['i1'] }],
    },
  ],
  rating: 4,
  category: 'Baking',
  equipment: ['Oven'],
  servings: 8,
  storage: [],
  notes: null,
  mealType: 'Dessert',
  occasion: null,
};

const flour = {
  id: 'i1',
  name: 'flour',
  quantity: '2 cups',
  normalizedIngredientId: null,
  normalizedIngredientName: null,
  category: 'Pantry',
};

const renderPage = async () =>
  render(
    <ToastProvider>
      {await RecipePage({ params: Promise.resolve({ id: 'r1' }) } as never)}
    </ToastProvider>,
  );

describe('RecipePage', () => {
  beforeEach(() => {
    query = '';
    (getUser as jest.Mock).mockResolvedValue({ id: 'owner' });
    (canModifyRecipe as jest.Mock).mockReturnValue(true);
    (getRecipeForDisplay as jest.Mock).mockResolvedValue(recipe);
    (getRecipeIngredientsForDisplay as jest.Mock).mockResolvedValue([
      { title: 'Dry goods', ingredients: [flour] },
    ]);
    (getIngredientsForRecipeEdit as jest.Mock).mockResolvedValue([
      { id: '1', name: 'Flour', category: 'Baking' },
    ]);
  });

  it('shows a message when the recipe does not exist', async () => {
    (getRecipeForDisplay as jest.Mock).mockResolvedValue(null);

    await renderPage();

    expect(screen.getByText('Recipe not found')).toBeInTheDocument();
  });

  it('fetches the recipe and its ingredients by id', async () => {
    await renderPage();

    expect(getRecipeForDisplay).toHaveBeenCalledWith('r1');
    expect(getRecipeIngredientsForDisplay).toHaveBeenCalledWith('r1');
  });

  it('renders the recipe details', async () => {
    await renderPage();

    expect(
      screen.getByRole('heading', { name: 'Banana Bread' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'https://example.com/banana' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Baking')).toBeInTheDocument();
    expect(screen.getByText('Dessert')).toBeInTheDocument();
    expect(screen.getByText('Oven')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Servings' })).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: '2 cups flour' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Mash bananas/ }),
    ).toBeInTheDocument();
  });

  describe('permissions', () => {
    it('gives the owner every control', async () => {
      await renderPage();

      expect(
        screen.getByRole('button', { name: 'Remove bookmark' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Edit recipe' })).toHaveAttribute(
        'href',
        '/recipes/r1/edit',
      );
      expect(
        screen.getByRole('link', { name: 'Refresh recipe from source' }),
      ).toHaveAttribute('href', '/recipes/r1/edit?refresh=1');
      expect(
        screen.getByRole('button', { name: 'Shopping list' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Delete recipe' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'I made this' }),
      ).toBeEnabled();
    });

    it("lets an admin edit but not bookmark someone else's recipe", async () => {
      (getUser as jest.Mock).mockResolvedValue({ id: 'admin' });

      await renderPage();

      expect(canModifyRecipe).toHaveBeenCalledWith({ id: 'admin' }, 'owner');
      expect(
        screen.queryByRole('button', { name: /bookmark/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Edit recipe' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Delete recipe' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'I made this' }),
      ).toBeEnabled();
    });

    it('lets a signed-in non-owner view and use the shopping list only', async () => {
      (getUser as jest.Mock).mockResolvedValue({ id: 'other' });
      (canModifyRecipe as jest.Mock).mockReturnValue(false);

      await renderPage();

      expect(
        screen.queryByRole('link', { name: 'Edit recipe' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Delete recipe' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /bookmark/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Shopping list' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'I made this' }),
      ).toBeDisabled();
    });

    it('is read-only for signed-out visitors, without fetching ingredient options', async () => {
      (getUser as jest.Mock).mockResolvedValue(null);
      (canModifyRecipe as jest.Mock).mockReturnValue(false);

      await renderPage();

      expect(getIngredientsForRecipeEdit).not.toHaveBeenCalled();
      expect(
        screen.queryByRole('button', { name: 'Shopping list' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'Edit recipe' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'I made this' }),
      ).toBeDisabled();
      // The recipe itself is still visible
      expect(
        screen.getByRole('heading', { name: 'Banana Bread' }),
      ).toBeInTheDocument();
    });
  });

  it('shows the made checkbox checked for a made recipe', async () => {
    await renderPage();

    expect(screen.getByRole('checkbox', { name: 'I made this' })).toBeChecked();
  });

  it('toasts and clears the param when the image failed to import', async () => {
    query = 'imageError=1';

    await renderPage();

    expect(
      await screen.findByText(/image couldn't be imported/),
    ).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith('/recipes/r1', { scroll: false });
  });

  describe('cooking mode', () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, 'wakeLock');
    });

    it('is offered when the browser supports wake lock', async () => {
      Object.defineProperty(navigator, 'wakeLock', {
        value: { request: jest.fn() },
        configurable: true,
      });

      await renderPage();

      expect(
        screen.getByRole('switch', { name: 'Cooking mode' }),
      ).toBeInTheDocument();
    });

    it('is hidden when it is not supported', async () => {
      await renderPage();

      expect(
        screen.queryByRole('switch', { name: 'Cooking mode' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('notes', () => {
    it('is omitted when the recipe has none', async () => {
      await renderPage();

      expect(
        screen.queryByRole('heading', { name: 'Notes' }),
      ).not.toBeInTheDocument();
    });

    it('renders one paragraph per non-blank line', async () => {
      (getRecipeForDisplay as jest.Mock).mockResolvedValue({
        ...recipe,
        notes: 'Use ripe bananas\n\n  \nBake longer if needed',
      });

      await renderPage();

      const section = screen.getByRole('heading', {
        name: 'Notes',
      }).parentElement!;
      expect(
        [...section.querySelectorAll('p')].map((p) => p.textContent),
      ).toEqual(['Use ripe bananas', 'Bake longer if needed']);
    });
  });
});

describe('generateMetadata', () => {
  it('titles the page with the recipe name', async () => {
    (getRecipeForDisplay as jest.Mock).mockResolvedValue(recipe);

    await expect(
      generateMetadata({ params: Promise.resolve({ id: 'r1' }) }),
    ).resolves.toEqual({ title: 'Banana Bread | Recipe Vault' });
  });

  it('falls back when the recipe is missing', async () => {
    (getRecipeForDisplay as jest.Mock).mockResolvedValue(null);

    await expect(
      generateMetadata({ params: Promise.resolve({ id: 'nope' }) }),
    ).resolves.toEqual({ title: 'Recipe not found | Recipe Vault' });
  });
});
