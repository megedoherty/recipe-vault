import { act, fireEvent, render, screen } from '@testing-library/react';

import { deleteRecipe } from '@/lib/actions/recipes';

import DeleteButton from './DeleteButton';

jest.mock('@/lib/actions/recipes', () => ({
  deleteRecipe: jest.fn(),
}));

const defaultProps = {
  recipeId: '1',
};

describe('DeleteButton', () => {
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

  it('should render the delete button', () => {
    render(<DeleteButton {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: 'Delete recipe' }),
    ).toBeInTheDocument();
  });

  it('should render the dialog', async () => {
    render(<DeleteButton {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete recipe' }));
    });

    // Dialog
    expect(screen.getByText('Delete Recipe')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete this recipe?'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should call the deleteRecipe action when the delete button is clicked', async () => {
    const mockDeleteRecipe = deleteRecipe as jest.MockedFunction<
      typeof deleteRecipe
    >;

    render(<DeleteButton {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete recipe' }));
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    });

    expect(mockDeleteRecipe).toHaveBeenCalledWith(defaultProps.recipeId);
  });

  it('should close the dialog when the cancel button is clicked', async () => {
    render(<DeleteButton {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete recipe' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });
});
