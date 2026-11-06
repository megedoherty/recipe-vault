import { act, fireEvent, render, screen } from '@testing-library/react';

import { addCustomListToShoppingList } from '@/lib/actions/shoppingList';

import AddCustomListButton from './AddCustomListButton';

jest.mock('@/lib/actions/shoppingList', () => ({
  addCustomListToShoppingList: jest.fn(),
}));

const ingredientOptions = [{ id: '1', name: 'lemon', category: 'Produce' }];

describe('AddCustomListButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  const openAndProcess = async (text: string) => {
    render(<AddCustomListButton ingredientOptions={ingredientOptions} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add Custom List' }));
    });
    fireEvent.change(screen.getByLabelText('All Items'), {
      target: { value: text },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Process Items' }));
  };

  it('disables the add button until items are processed', async () => {
    render(<AddCustomListButton ingredientOptions={ingredientOptions} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add Custom List' }));
    });
    expect(
      screen.getByRole('button', { name: 'Add to Shopping List' }),
    ).toBeDisabled();
  });

  it('parses pasted text and adds it with the list name', async () => {
    jest.mocked(addCustomListToShoppingList).mockResolvedValue({
      success: true,
    });
    await openAndProcess('2 lemons\nsalt');
    fireEvent.change(screen.getByLabelText('List Name (optional)'), {
      target: { value: 'Party' },
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Add to Shopping List' }),
      );
    });

    expect(addCustomListToShoppingList).toHaveBeenCalledTimes(1);
    const [listName, items] = jest.mocked(addCustomListToShoppingList).mock
      .calls[0];
    expect(listName).toBe('Party');
    expect(items).toHaveLength(2);
    expect(items.map((item) => item.name)).toEqual(
      expect.arrayContaining(['salt']),
    );
  });

  it('shows an error when the action fails', async () => {
    jest.mocked(addCustomListToShoppingList).mockResolvedValue({
      success: false,
      error: 'Nope',
    });
    await openAndProcess('salt');

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Add to Shopping List' }),
      );
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Nope');
  });
});
