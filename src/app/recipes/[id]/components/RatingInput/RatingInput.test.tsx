import { act, fireEvent, render, screen } from '@testing-library/react';

import { updateRecipeRating } from '@/lib/actions/recipes';

import RatingInput from './RatingInput';

jest.mock('@/lib/actions/recipes', () => ({
  updateRecipeRating: jest.fn(),
}));

const defaultProps = {
  recipeId: '1',
  initialRating: null,
};

describe('RatingInput', () => {
  it('should render all the stars', () => {
    render(<RatingInput {...defaultProps} />);
    expect(screen.getByRole('radio', { name: '1 star' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2 stars' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '3 stars' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '4 stars' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '5 stars' })).toBeInTheDocument();
  });

  it('should render the stars as filled if initialRating is not null', () => {
    render(<RatingInput {...defaultProps} initialRating={1} />);
    expect(screen.getByRole('radio', { name: '1 star' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '2 stars' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: '3 stars' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: '4 stars' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: '5 stars' })).not.toBeChecked();
  });

  it('should not render the stars as filled if initialRating is null', () => {
    render(<RatingInput {...defaultProps} />);
    expect(screen.getByRole('radio', { name: '1 star' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: '2 stars' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: '3 stars' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: '4 stars' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: '5 stars' })).not.toBeChecked();
  });

  it('should call the updateRecipeRating action when the rating is changed', async () => {
    render(<RatingInput {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: '1 star' }));
    });
    expect(updateRecipeRating).toHaveBeenCalledWith(defaultProps.recipeId, 1);
  });

  it('should log an error if the updateRecipeRating action fails', async () => {
    const mockUpdateRecipeRating = updateRecipeRating as jest.MockedFunction<
      typeof updateRecipeRating
    >;
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockUpdateRecipeRating.mockRejectedValue(
      new Error('Failed to update recipe rating'),
    );

    render(<RatingInput {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: '1 star' }));
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      new Error('Failed to update recipe rating'),
    );
  });

  it('should not move focus to the previous input when the left or up arrow key is pressed if the first input is focused', async () => {
    render(<RatingInput {...defaultProps} />);
    await act(async () => {
      fireEvent.keyDown(screen.getByRole('radio', { name: '1 star' }), {
        key: 'ArrowLeft',
      });
    });
    expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();

    await act(async () => {
      fireEvent.keyDown(screen.getByRole('radio', { name: '1 star' }), {
        key: 'ArrowUp',
      });
    });
    expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
  });

  it('should move focus to the next input when the right or down arrow key is pressed', async () => {
    render(<RatingInput {...defaultProps} />);

    await act(async () => {
      fireEvent.keyDown(screen.getByRole('radio', { name: '1 star' }), {
        key: 'ArrowRight',
      });
    });
    expect(screen.getByRole('radio', { name: '2 stars' })).toHaveFocus();

    await act(async () => {
      fireEvent.keyDown(screen.getByRole('radio', { name: '1 star' }), {
        key: 'ArrowDown',
      });
    });
    expect(screen.getByRole('radio', { name: '2 stars' })).toHaveFocus();
  });

  it('should not move focus to the next input when the right or down arrow key is pressed if the last input is focused', async () => {
    render(<RatingInput {...defaultProps} />);
    await act(async () => {
      fireEvent.keyDown(screen.getByRole('radio', { name: '5 stars' }), {
        key: 'ArrowRight',
      });
    });
    expect(screen.getByRole('radio', { name: '5 stars' })).toHaveFocus();

    await act(async () => {
      fireEvent.keyDown(screen.getByRole('radio', { name: '5 stars' }), {
        key: 'ArrowDown',
      });
    });
    expect(screen.getByRole('radio', { name: '5 stars' })).toHaveFocus();
  });

  it('should move focus to the previous input when the left or up arrow key is pressed', async () => {
    render(<RatingInput {...defaultProps} />);
    await act(async () => {
      fireEvent.keyDown(screen.getByRole('radio', { name: '2 stars' }), {
        key: 'ArrowLeft',
      });
    });
    expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();

    await act(async () => {
      fireEvent.keyDown(screen.getByRole('radio', { name: '2 stars' }), {
        key: 'ArrowUp',
      });
    });
    expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
  });

  it('should change the rating when the enter key is pressed', async () => {
    render(<RatingInput {...defaultProps} />);
    await act(async () => {
      fireEvent.keyDown(screen.getByRole('radio', { name: '1 star' }), {
        key: 'Enter',
      });
    });
    expect(updateRecipeRating).toHaveBeenCalledWith(defaultProps.recipeId, 1);
  });

  it('should change the rating when the space key is pressed', async () => {
    render(<RatingInput {...defaultProps} />);
    await act(async () => {
      fireEvent.keyDown(screen.getByRole('radio', { name: '1 star' }), {
        key: ' ',
      });
    });

    expect(updateRecipeRating).toHaveBeenCalledWith(defaultProps.recipeId, 1);
  });
});
