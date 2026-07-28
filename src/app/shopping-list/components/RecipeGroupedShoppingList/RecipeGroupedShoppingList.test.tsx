import { fireEvent, render, screen } from '@testing-library/react';

import { removeFromShoppingList } from '@/lib/actions/shoppingList';
import { CombinedShoppingListItem, ShoppingListByRecipe } from '@/types';

import RecipeGroupedShoppingList from './RecipeGroupedShoppingList';

jest.mock('@/lib/actions/shoppingList', () => ({
  removeFromShoppingList: jest.fn(),
}));

const groups: ShoppingListByRecipe[] = [
  {
    recipeId: 'r1',
    recipeName: 'Recipe A',
    items: [
      {
        id: 'a',
        recipeId: 'r1',
        recipeName: 'Recipe A',
        name: 'milk',
        quantity: '1 cup',
        normalizedIngredientId: 10,
        normalizedIngredientName: null,
        category: 'Dairy',
        purchased: false,
      },
    ],
  },
  {
    recipeId: null,
    recipeName: 'Manually Added',
    items: [
      {
        id: 'b',
        recipeId: null,
        recipeName: null,
        name: 'salt',
        quantity: null,
        normalizedIngredientId: null,
        normalizedIngredientName: null,
        category: 'Other',
        purchased: false,
      },
    ],
  },
];

const combinedItems: CombinedShoppingListItem[] = [
  {
    groupKey: '10',
    name: 'milk',
    category: 'Dairy',
    quantity: 1,
    unit: 'cup',
    purchased: true,
    sourceItemIds: ['a'],
    lines: ['1 cup milk (Recipe A)'],
  },
];

describe('RecipeGroupedShoppingList', () => {
  it('should render a message when there are no groups', () => {
    render(
      <RecipeGroupedShoppingList
        groups={[]}
        combinedItems={[]}
        onOptimisticUpdate={jest.fn()}
      />,
    );
    expect(
      screen.getByText('Your shopping list is empty.'),
    ).toBeInTheDocument();
  });

  it('should render one section per recipe including "Manually Added"', () => {
    render(
      <RecipeGroupedShoppingList
        groups={groups}
        combinedItems={combinedItems}
        onOptimisticUpdate={jest.fn()}
      />,
    );
    expect(screen.getByText('Recipe A')).toBeInTheDocument();
    expect(screen.getByText('Manually Added')).toBeInTheDocument();
    expect(screen.getByText('1 cup milk')).toBeInTheDocument();
    expect(screen.getByText('salt')).toBeInTheDocument();
  });

  it('should not render any checkboxes (read-only view)', () => {
    render(
      <RecipeGroupedShoppingList
        groups={groups}
        combinedItems={combinedItems}
        onOptimisticUpdate={jest.fn()}
      />,
    );
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('should mark items as purchased when their combined group is purchased', () => {
    render(
      <RecipeGroupedShoppingList
        groups={groups}
        combinedItems={combinedItems}
        onOptimisticUpdate={jest.fn()}
      />,
    );
    expect(screen.getByText('1 cup milk')).toHaveClass('purchased');
    expect(screen.getByText('salt')).not.toHaveClass('purchased');
  });

  it('should render a remove button per group', () => {
    render(
      <RecipeGroupedShoppingList
        groups={groups}
        combinedItems={combinedItems}
        onOptimisticUpdate={jest.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Remove Recipe A' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Manually Added' }),
    ).toBeInTheDocument();
  });

  it('should dispatch an optimistic update and call removeFromShoppingList with all item ids for that recipe', async () => {
    const mockRemove = removeFromShoppingList as jest.MockedFunction<
      typeof removeFromShoppingList
    >;
    mockRemove.mockResolvedValue({ success: true });
    const onOptimisticUpdate = jest.fn();

    render(
      <RecipeGroupedShoppingList
        groups={groups}
        combinedItems={combinedItems}
        onOptimisticUpdate={onOptimisticUpdate}
      />,
    );

    const recipeASection = screen.getByText('Recipe A').closest('li');
    const removeButton = recipeASection?.querySelector('button');
    if (!removeButton) throw new Error('Remove recipe button not found');

    await fireEvent.click(removeButton);

    expect(onOptimisticUpdate).toHaveBeenCalledWith({
      type: 'remove',
      itemIds: ['a'],
    });
    expect(mockRemove).toHaveBeenCalledWith(['a']);
  });
});
