import { act, fireEvent, render, screen } from '@testing-library/react';

import { updateRecipeRating } from '@/lib/actions/recipes';

import RatingInputForm from './RatingInputForm';

const mockShowToast = jest.fn();

jest.mock('@/components/molecules/Toast/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast, dismissToast: jest.fn() }),
}));

jest.mock('@/lib/actions/recipes', () => ({
  updateRecipeRating: jest.fn(),
}));

const mockUpdateRecipeRating = updateRecipeRating as jest.MockedFunction<
  typeof updateRecipeRating
>;

const defaultProps = {
  recipeId: '1',
  initialRating: null,
};

const getStar = (name: string) => screen.getByRole('radio', { name });

describe('RatingInputForm', () => {
  beforeEach(() => {
    mockUpdateRecipeRating.mockReset();
    mockShowToast.mockReset();
  });

  it('should call the updateRecipeRating action when the rating is changed', async () => {
    mockUpdateRecipeRating.mockResolvedValue(undefined);
    render(<RatingInputForm {...defaultProps} />);
    await act(async () => {
      fireEvent.click(getStar('1 star'));
    });
    expect(updateRecipeRating).toHaveBeenCalledWith(defaultProps.recipeId, 1);
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('should update immediately, before the server responds, and stay enabled', async () => {
    let resolve: () => void = () => {};
    mockUpdateRecipeRating.mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );

    render(<RatingInputForm {...defaultProps} />);
    await act(async () => {
      fireEvent.click(getStar('3 stars'));
    });

    expect(getStar('3 stars')).toBeChecked();
    expect(getStar('3 stars')).toBeEnabled();

    await act(async () => resolve());
    expect(getStar('3 stars')).toBeChecked();
  });

  it('should roll back and show a toast if the updateRecipeRating action fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockUpdateRecipeRating.mockRejectedValue(
      new Error('Failed to update recipe rating'),
    );

    render(<RatingInputForm {...defaultProps} initialRating={2} />);
    await act(async () => {
      fireEvent.click(getStar('4 stars'));
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      new Error('Failed to update recipe rating'),
    );
    expect(mockShowToast).toHaveBeenCalledWith(
      "Couldn't save rating. Please try again!",
    );
    expect(getStar('2 stars')).toBeChecked();
    consoleErrorSpy.mockRestore();
  });
});
