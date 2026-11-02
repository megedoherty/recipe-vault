import { fireEvent, render, screen } from '@testing-library/react';

import { CombinedIngredients } from '@/lib/utils/shoppingListSwaps';
import { RecipeIngredientDisplay } from '@/types';

import ShoppingListIngredients from './ShoppingListIngredients';

const milkLine: RecipeIngredientDisplay = {
  id: '1',
  name: 'milk',
  quantity: '1 cup',
  normalizedIngredientId: 300,
  normalizedIngredientName: 'milk',
  category: 'Dairy',
};

const row: CombinedIngredients = {
  ingredientId: '300',
  name: 'milk',
  category: 'Dairy',
  quantity: 1,
  unit: 'cup',
  sourceIngredients: [milkLine],
};

const defaultProps = {
  combinedIngredients: [row],
  originalsById: new Map([['1', milkLine]]),
  swaps: {},
  selectedIds: new Set(['1']),
  error: null,
  onToggle: jest.fn(),
  onSwap: jest.fn(),
};

describe('ShoppingListIngredients', () => {
  it('renders rows under their category with the combined quantity', () => {
    render(<ShoppingListIngredients {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Dairy' })).toBeInTheDocument();
    expect(
      screen.getByText('1 cup milk', { selector: 'span' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '1 cup milk' })).toBeChecked();
  });

  it('calls onToggle when a source line is toggled', () => {
    const onToggle = jest.fn();
    render(<ShoppingListIngredients {...defaultProps} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('checkbox', { name: '1 cup milk' }));

    expect(onToggle).toHaveBeenCalledWith('1', false);
  });

  it('calls onSwap with the row when Swap is clicked', () => {
    const onSwap = jest.fn();
    render(<ShoppingListIngredients {...defaultProps} onSwap={onSwap} />);

    fireEvent.click(screen.getByRole('button', { name: 'Swap milk' }));

    expect(onSwap).toHaveBeenCalledWith(row);
  });

  it('hides Swap for rows without a matched ingredient', () => {
    render(
      <ShoppingListIngredients
        {...defaultProps}
        combinedIngredients={[{ ...row, ingredientId: '' }]}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /Swap/ }),
    ).not.toBeInTheDocument();
  });

  it('notes what a swapped row replaced and shows the original line text', () => {
    render(
      <ShoppingListIngredients
        {...defaultProps}
        combinedIngredients={[{ ...row, name: 'oat milk' }]}
        swaps={{ '1': { id: '901', name: 'oat milk', category: 'Dairy' } }}
      />,
    );

    expect(screen.getByText('instead of milk')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: '1 cup milk' }),
    ).toBeInTheDocument();
  });

  it('shows an error message', () => {
    render(<ShoppingListIngredients {...defaultProps} error="Nope" />);

    expect(screen.getByText('Nope')).toBeInTheDocument();
  });
});
