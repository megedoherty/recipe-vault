import { fireEvent, render, screen } from '@testing-library/react';
import { cookies } from 'next/headers';

import { PREFER_GRAMS_COOKIE } from '@/constants';
import { getIngredientsForRecipeEdit } from '@/lib/supabase/queries/ingredients';
import { getShoppingListItems } from '@/lib/supabase/queries/shoppingList';

import ShoppingListPage, { metadata } from './page';

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('@/lib/supabase/queries/ingredients');
jest.mock('@/lib/supabase/queries/shoppingList');
jest.mock('@/lib/actions/shoppingList', () => ({
  addCustomListToShoppingList: jest.fn(),
  clearShoppingList: jest.fn(),
  removeFromShoppingList: jest.fn(),
  setPurchased: jest.fn(),
}));

const mockCookie = (value?: string) =>
  (cookies as jest.Mock).mockResolvedValue({
    get: (name: string) =>
      name === PREFER_GRAMS_COOKIE && value !== undefined
        ? { value }
        : undefined,
  });

const gramsSwitch = () => screen.getByRole('switch', { name: 'Grams' });

describe('ShoppingListPage', () => {
  beforeEach(() => {
    (getShoppingListItems as jest.Mock).mockResolvedValue([
      {
        id: 'a',
        recipeId: 'r1',
        recipeName: 'Pancakes',
        name: 'milk',
        quantity: '1 cup',
        normalizedIngredientId: null,
        normalizedIngredientName: null,
        category: 'Dairy',
        purchased: false,
      },
    ]);
    (getIngredientsForRecipeEdit as jest.Mock).mockResolvedValue([]);
    mockCookie();
  });

  it('renders the shopping list with the fetched items', async () => {
    render(await ShoppingListPage());

    expect(
      screen.getByRole('heading', { name: 'Shopping List' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /milk/ })).toBeInTheDocument();
  });

  it('prefers grams when the cookie is missing', async () => {
    render(await ShoppingListPage());

    expect(gramsSwitch()).toBeChecked();
  });

  it('prefers grams when the cookie is "true"', async () => {
    mockCookie('true');
    render(await ShoppingListPage());

    expect(gramsSwitch()).toBeChecked();
  });

  it('does not prefer grams only when the cookie is "false"', async () => {
    mockCookie('false');
    render(await ShoppingListPage());

    expect(gramsSwitch()).not.toBeChecked();
  });

  it('lets the user toggle the units preference', async () => {
    render(await ShoppingListPage());

    fireEvent.click(gramsSwitch());

    expect(gramsSwitch()).not.toBeChecked();
  });

  it('sets the page title', () => {
    expect(metadata.title).toBe('Shopping List | Recipe Vault');
  });
});
