import { act, fireEvent, render, screen } from '@testing-library/react';

import { addToShoppingList } from '@/lib/actions/shoppingList';
import { RecipeIngredientDisplay } from '@/types';

import AddToShoppingListButton from './AddToShoppingListButton';

jest.mock('@/lib/actions/shoppingList', () => ({
  addToShoppingList: jest.fn(),
}));

const ingredients: RecipeIngredientDisplay[] = [
  {
    id: '1',
    name: 'milk',
    quantity: '1 cup',
    normalizedIngredientId: 10,
    normalizedIngredientName: 'milk',
    category: 'Dairy',
  },
  {
    id: '2',
    name: 'eggs',
    quantity: '2',
    normalizedIngredientId: 20,
    normalizedIngredientName: 'egg',
    category: 'Eggs',
  },
];

const defaultProps = {
  ingredients,
  recipeId: 'recipe-1',
  recipeName: 'Test Recipe',
};

describe('AddToShoppingListButton', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = jest.fn(function (
      this: HTMLDialogElement,
    ) {
      this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = jest.fn(function (
      this: HTMLDialogElement,
    ) {
      this.removeAttribute('open');
    });
  });

  const openDialog = async () => {
    render(<AddToShoppingListButton {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Shopping list' }));
    });
  };

  it('should render the trigger button', () => {
    render(<AddToShoppingListButton {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: 'Shopping list' }),
    ).toBeInTheDocument();
  });

  it('should open the dialog with all ingredients pre-checked', async () => {
    await openDialog();

    expect(screen.getByText('Shopping List')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '1 cup milk' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: '2 eggs' })).toBeChecked();
  });

  it('should remove an ingredient from the combined preview when unchecked', async () => {
    await openDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: '2 eggs' }));
    });

    expect(
      screen.queryByRole('checkbox', { name: '2 eggs' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '1 cup milk' })).toBeChecked();
  });

  it('should call addToShoppingList with only the selected ingredients on confirm', async () => {
    const mockAddToShoppingList = addToShoppingList as jest.MockedFunction<
      typeof addToShoppingList
    >;
    mockAddToShoppingList.mockResolvedValue({ success: true });

    await openDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: '2 eggs' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add to List' }));
    });

    expect(mockAddToShoppingList).toHaveBeenCalledWith(
      [ingredients[0]],
      defaultProps.recipeId,
      defaultProps.recipeName,
    );
  });

  it('should close the dialog when addToShoppingList succeeds', async () => {
    const mockAddToShoppingList = addToShoppingList as jest.MockedFunction<
      typeof addToShoppingList
    >;
    mockAddToShoppingList.mockResolvedValue({ success: true });

    await openDialog();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add to List' }));
    });

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });

  it('should show an error and keep the dialog open when addToShoppingList fails', async () => {
    const mockAddToShoppingList = addToShoppingList as jest.MockedFunction<
      typeof addToShoppingList
    >;
    mockAddToShoppingList.mockResolvedValue({
      success: false,
      error: 'Something went wrong',
    });

    await openDialog();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add to List' }));
    });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Shopping List')).toBeInTheDocument();
  });

  it('should disable the confirm button when no ingredients are selected', async () => {
    await openDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: '1 cup milk' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: '2 eggs' }));
    });

    expect(screen.getByRole('button', { name: 'Add to List' })).toBeDisabled();
  });

  it('should combine mixed cup/gram quantities for the same ingredient via density conversion', async () => {
    const mixedUnitIngredients: RecipeIngredientDisplay[] = [
      {
        id: '1',
        name: 'flour',
        quantity: '1 cup',
        normalizedIngredientId: 1, // All-purpose flour, 120 g/cup
        normalizedIngredientName: 'all-purpose flour',
        category: 'Flours & Starches',
      },
      {
        id: '2',
        name: 'flour',
        quantity: '60 g',
        normalizedIngredientId: 1,
        normalizedIngredientName: 'all-purpose flour',
        category: 'Flours & Starches',
      },
    ];

    render(
      <AddToShoppingListButton
        {...defaultProps}
        ingredients={mixedUnitIngredients}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Shopping list' }));
    });

    expect(screen.getByText('180 g all-purpose flour')).toBeInTheDocument();
  });
});
