import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { setPurchased } from '@/lib/actions/shoppingList';
import { ShoppingListItem } from '@/types';

import ShoppingListView from './ShoppingListView';

jest.mock('@/lib/actions/shoppingList', () => ({
  clearShoppingList: jest.fn(),
  removeFromShoppingList: jest.fn(),
  setPurchased: jest.fn(),
}));

const items: ShoppingListItem[] = [
  {
    id: 'a',
    recipeId: 'r1',
    recipeName: 'Recipe A',
    name: 'milk',
    quantity: '1 cup',
    normalizedIngredientId: 999,
    normalizedIngredientName: null,
    category: 'Dairy',
    purchased: false,
  },
  {
    id: 'b',
    recipeId: 'r2',
    recipeName: 'Recipe B',
    name: 'milk',
    quantity: '1 cup',
    normalizedIngredientId: 999,
    normalizedIngredientName: null,
    category: 'Dairy',
    purchased: false,
  },
];

const defaultProps = {
  items,
  initialPreferGrams: true,
};

describe('ShoppingListView', () => {
  it('should render the Clear List button', () => {
    render(<ShoppingListView {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: 'Clear List' }),
    ).toBeInTheDocument();
  });

  it('should default to the Combined tab', () => {
    render(<ShoppingListView {...defaultProps} />);

    expect(screen.getByRole('tab', { name: 'Combined' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    // Combined view merges both recipes' milk into one 2 cups checkbox
    expect(
      screen.getByRole('checkbox', { name: '2 cups milk' }),
    ).toBeInTheDocument();
  });

  it('should switch to the By Recipe tab and show per-recipe sections', () => {
    render(<ShoppingListView {...defaultProps} />);

    fireEvent.click(screen.getByRole('tab', { name: 'By Recipe' }));

    expect(screen.getByRole('tab', { name: 'By Recipe' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Recipe A')).toBeInTheDocument();
    expect(screen.getByText('Recipe B')).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('should update the checkbox immediately without waiting on the action to resolve', async () => {
    const mockSetPurchased = setPurchased as jest.MockedFunction<
      typeof setPurchased
    >;
    // Never resolves, simulating an in-flight request.
    mockSetPurchased.mockReturnValue(new Promise(() => {}));

    render(<ShoppingListView {...defaultProps} />);

    fireEvent.click(screen.getByRole('checkbox', { name: '2 cups milk' }));

    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: '2 cups milk' }),
      ).toBeChecked();
    });
  });

  it('should use initialPreferGrams to set the starting unit toggle state', () => {
    render(<ShoppingListView {...defaultProps} initialPreferGrams={false} />);
    expect(
      screen.getByRole('button', { name: 'Show grams' }),
    ).toBeInTheDocument();

    render(<ShoppingListView {...defaultProps} initialPreferGrams={true} />);
    expect(
      screen.getByRole('button', { name: 'Show imperial units' }),
    ).toBeInTheDocument();
  });
});
