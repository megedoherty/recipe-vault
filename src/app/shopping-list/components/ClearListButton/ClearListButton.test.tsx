import { act, fireEvent, render, screen } from '@testing-library/react';

import { clearShoppingList } from '@/lib/actions/shoppingList';

import ClearListButton from './ClearListButton';

jest.mock('@/lib/actions/shoppingList', () => ({
  clearShoppingList: jest.fn(),
}));

describe('ClearListButton', () => {
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

  it('should render the trigger button', () => {
    render(<ClearListButton onClear={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Clear List' }),
    ).toBeInTheDocument();
  });

  it('should render a confirmation dialog', async () => {
    render(<ClearListButton onClear={jest.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear List' }));
    });

    expect(screen.getByText('Clear Shopping List')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should dispatch the optimistic clear and call clearShoppingList when confirmed', async () => {
    const mockClearShoppingList = clearShoppingList as jest.MockedFunction<
      typeof clearShoppingList
    >;
    mockClearShoppingList.mockResolvedValue({ success: true });
    const onClear = jest.fn();

    render(<ClearListButton onClear={onClear} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear List' }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    });

    expect(onClear).toHaveBeenCalled();
    expect(mockClearShoppingList).toHaveBeenCalled();
  });

  it('should close the dialog immediately when confirmed, without waiting on the action', async () => {
    const mockClearShoppingList = clearShoppingList as jest.MockedFunction<
      typeof clearShoppingList
    >;
    // Never resolves, simulating an in-flight request.
    mockClearShoppingList.mockReturnValue(new Promise(() => {}));

    render(<ClearListButton onClear={jest.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear List' }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    });

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });

  it('should close the dialog when cancel is clicked', async () => {
    render(<ClearListButton onClear={jest.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear List' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });
});
