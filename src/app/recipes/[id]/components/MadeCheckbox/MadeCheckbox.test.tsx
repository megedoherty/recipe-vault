import { act, fireEvent, render, screen } from '@testing-library/react';

import { toggleRecipeMade } from '@/lib/actions/recipes';

import MadeCheckbox from './MadeCheckbox';

jest.mock('@/lib/actions/recipes', () => ({
  toggleRecipeMade: jest.fn(),
}));

const defaultProps = {
  recipeId: '1',
  initialChecked: false,
};

describe('MadeCheckbox', () => {
  it('should render the made checkbox', () => {
    render(<MadeCheckbox {...defaultProps} />);
    expect(
      screen.getByRole('checkbox', { name: 'I made this' }),
    ).toBeInTheDocument();
  });

  it('should render the made checkbox as checked if initialChecked is true', () => {
    render(<MadeCheckbox {...defaultProps} initialChecked={true} />);
    expect(screen.getByRole('checkbox', { name: 'I made this' })).toBeChecked();
  });

  it('should call the toggleRecipeMade action when the checkbox is changed', async () => {
    const mockToggleRecipeMade = toggleRecipeMade as jest.MockedFunction<
      typeof toggleRecipeMade
    >;
    mockToggleRecipeMade.mockResolvedValue(undefined);

    render(<MadeCheckbox {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'I made this' }));
    });
    expect(toggleRecipeMade).toHaveBeenCalledWith(defaultProps.recipeId, true);
  });

  it('should log an error if the toggleRecipeMade action fails', async () => {
    const mockToggleRecipeMade = toggleRecipeMade as jest.MockedFunction<
      typeof toggleRecipeMade
    >;
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockToggleRecipeMade.mockRejectedValue(
      new Error('Failed to toggle recipe made'),
    );

    render(<MadeCheckbox {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'I made this' }));
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      new Error('Failed to toggle recipe made'),
    );
  });
});
