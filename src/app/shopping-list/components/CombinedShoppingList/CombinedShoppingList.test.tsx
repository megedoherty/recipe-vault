import { act, fireEvent, render, screen } from '@testing-library/react';

import {
  removeFromShoppingList,
  setPurchased,
} from '@/lib/actions/shoppingList';
import { CombinedShoppingListItem } from '@/types';

import CombinedShoppingList from './CombinedShoppingList';

jest.mock('@/lib/actions/shoppingList', () => ({
  removeFromShoppingList: jest.fn(),
  setPurchased: jest.fn(),
}));

const items: CombinedShoppingListItem[] = [
  {
    groupKey: '10',
    name: 'milk',
    category: 'Dairy',
    quantity: 2,
    unit: 'cups',
    purchased: false,
    sourceItemIds: ['a', 'b'],
    lines: ['1 cup milk (Recipe A)', '1 cup milk (Recipe B)'],
  },
  {
    groupKey: '20',
    name: 'flour',
    category: 'Flours & Starches',
    quantity: 1,
    unit: 'cup',
    purchased: true,
    sourceItemIds: ['c'],
    lines: ['1 cup flour (Recipe A)'],
  },
];

const defaultProps = {
  items,
  onOptimisticUpdate: jest.fn(),
  preferGrams: true,
  onToggleUnits: jest.fn(),
};

describe('CombinedShoppingList', () => {
  it('should render a message when there are no items', () => {
    render(<CombinedShoppingList {...defaultProps} items={[]} />);
    expect(
      screen.getByText('Your shopping list is empty.'),
    ).toBeInTheDocument();
  });

  it('should render items grouped by category', () => {
    render(<CombinedShoppingList {...defaultProps} />);
    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Flours & Starches')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: '2 cups milk' }),
    ).toBeInTheDocument();
  });

  it('should dispatch an optimistic update and call setPurchased when a checkbox is toggled', async () => {
    const mockSetPurchased = setPurchased as jest.MockedFunction<
      typeof setPurchased
    >;
    mockSetPurchased.mockResolvedValue({ success: true });
    const onOptimisticUpdate = jest.fn();

    render(
      <CombinedShoppingList
        {...defaultProps}
        onOptimisticUpdate={onOptimisticUpdate}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: '2 cups milk' }));
    });

    expect(onOptimisticUpdate).toHaveBeenCalledWith({
      type: 'setPurchased',
      itemIds: ['a', 'b'],
      purchased: true,
    });
    expect(mockSetPurchased).toHaveBeenCalledWith(['a', 'b'], true);
  });

  it('should not disable other controls while a mutation is in flight', async () => {
    const mockSetPurchased = setPurchased as jest.MockedFunction<
      typeof setPurchased
    >;
    // Never resolves during this test, simulating an in-flight request.
    mockSetPurchased.mockReturnValue(new Promise(() => {}));

    render(<CombinedShoppingList {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: '2 cups milk' }));
    });

    expect(
      screen.getByRole('checkbox', { name: '1 cup flour' }),
    ).not.toBeDisabled();
    expect(
      screen.getAllByRole('button', { name: 'Remove flour' })[0],
    ).not.toBeDisabled();
  });

  it('should dispatch an optimistic update and call removeFromShoppingList when Remove is clicked', async () => {
    const mockRemove = removeFromShoppingList as jest.MockedFunction<
      typeof removeFromShoppingList
    >;
    mockRemove.mockResolvedValue({ success: true });
    const onOptimisticUpdate = jest.fn();

    render(
      <CombinedShoppingList
        {...defaultProps}
        onOptimisticUpdate={onOptimisticUpdate}
      />,
    );

    const milkRow = screen
      .getByRole('checkbox', { name: '2 cups milk' })
      .closest('li');
    const removeButton = milkRow?.querySelector('button');
    if (!removeButton) throw new Error('Remove button not found');

    await act(async () => {
      fireEvent.click(removeButton);
    });

    expect(onOptimisticUpdate).toHaveBeenCalledWith({
      type: 'remove',
      itemIds: ['a', 'b'],
    });
    expect(mockRemove).toHaveBeenCalledWith(['a', 'b']);
  });

  it('should show ingredient details by default', () => {
    render(<CombinedShoppingList {...defaultProps} />);
    expect(screen.getByText('1 cup milk (Recipe A)')).toBeInTheDocument();
  });

  it('should hide ingredient details when the "Details" switch is turned off', () => {
    render(<CombinedShoppingList {...defaultProps} />);

    const details = screen.getByRole('switch', { name: 'Details' });
    expect(details).toBeChecked();

    fireEvent.click(details);

    expect(screen.queryByText('1 cup milk (Recipe A)')).not.toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: '2 cups milk' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Details' })).not.toBeChecked();
  });

  it('should hide checked items when the "Hide checked" switch is turned on', () => {
    render(<CombinedShoppingList {...defaultProps} />);

    const hideChecked = screen.getByRole('switch', { name: 'Hide checked' });
    expect(hideChecked).not.toBeChecked();

    fireEvent.click(hideChecked);

    expect(
      screen.queryByRole('checkbox', { name: '1 cup flour' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Flours & Starches')).not.toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: '2 cups milk' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Hide checked' })).toBeChecked();
  });

  it('should show checked items again when the "Hide checked" switch is turned off', () => {
    render(<CombinedShoppingList {...defaultProps} />);

    fireEvent.click(screen.getByRole('switch', { name: 'Hide checked' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Hide checked' }));

    expect(
      screen.getByRole('checkbox', { name: '1 cup flour' }),
    ).toBeInTheDocument();
  });

  it('should show a message when every item is checked and hidden', () => {
    render(
      <CombinedShoppingList
        {...defaultProps}
        items={items.map((item) => ({ ...item, purchased: true }))}
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Hide checked' }));

    expect(
      screen.getByText('Everything on your list is checked off.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Hide checked' }),
    ).toBeInTheDocument();
  });

  it('should turn the "Grams" switch on when preferGrams is true', () => {
    render(<CombinedShoppingList {...defaultProps} preferGrams={true} />);
    expect(screen.getByRole('switch', { name: 'Grams' })).toBeChecked();
  });

  it('should turn the "Grams" switch off when preferGrams is false', () => {
    render(<CombinedShoppingList {...defaultProps} preferGrams={false} />);
    expect(screen.getByRole('switch', { name: 'Grams' })).not.toBeChecked();
  });

  it('should call onToggleUnits when the "Grams" switch is clicked', () => {
    const onToggleUnits = jest.fn();
    render(
      <CombinedShoppingList {...defaultProps} onToggleUnits={onToggleUnits} />,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Grams' }));

    expect(onToggleUnits).toHaveBeenCalled();
  });
});
