import { act, fireEvent, render, screen } from '@testing-library/react';

import { updateRecipeRating } from '@/lib/actions/recipes';

import RatingInputForm from './RatingInputForm';

jest.mock('@/lib/actions/recipes', () => ({
  updateRecipeRating: jest.fn(),
}));

const defaultProps = {
  recipeId: '1',
  initialRating: null,
};

describe('RatingInputForm', () => {
  it('should call the updateRecipeRating action when the rating is changed', async () => {
    render(<RatingInputForm {...defaultProps} />);
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

    render(<RatingInputForm {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: '1 star' }));
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      new Error('Failed to update recipe rating'),
    );
  });
});
