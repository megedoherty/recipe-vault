import { act, fireEvent, render, screen } from '@testing-library/react';

import { toggleRecipeMade } from '@/lib/actions/recipes';

import MadeCheckbox from './MadeCheckbox';

const mockShowToast = jest.fn();

jest.mock('@/components/molecules/Toast/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast, dismissToast: jest.fn() }),
}));

jest.mock('@/lib/actions/recipes', () => ({
  toggleRecipeMade: jest.fn(),
}));

const mockToggleRecipeMade = toggleRecipeMade as jest.MockedFunction<
  typeof toggleRecipeMade
>;

const defaultProps = {
  recipeId: '1',
  initialChecked: false,
};

const getCheckbox = () => screen.getByRole('checkbox', { name: 'I made this' });

describe('MadeCheckbox', () => {
  beforeEach(() => {
    mockToggleRecipeMade.mockReset();
    mockShowToast.mockReset();
  });

  it('should render the made checkbox', () => {
    render(<MadeCheckbox {...defaultProps} />);
    expect(getCheckbox()).toBeInTheDocument();
  });

  it('should render the made checkbox as checked if initialChecked is true', () => {
    render(<MadeCheckbox {...defaultProps} initialChecked={true} />);
    expect(getCheckbox()).toBeChecked();
  });

  it('should be disabled when readOnly', () => {
    render(<MadeCheckbox {...defaultProps} readOnly />);
    expect(getCheckbox()).toBeDisabled();
  });

  it('should call the toggleRecipeMade action when the checkbox is changed', async () => {
    mockToggleRecipeMade.mockResolvedValue(undefined);

    render(<MadeCheckbox {...defaultProps} />);

    await act(async () => {
      fireEvent.click(getCheckbox());
    });

    expect(toggleRecipeMade).toHaveBeenCalledWith(defaultProps.recipeId, true);
    expect(getCheckbox()).toBeChecked();
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('should update immediately, before the server responds, and stay enabled', async () => {
    let resolve: () => void = () => {};
    mockToggleRecipeMade.mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );

    render(<MadeCheckbox {...defaultProps} />);
    await act(async () => {
      fireEvent.click(getCheckbox());
    });

    expect(getCheckbox()).toBeChecked();
    expect(getCheckbox()).toBeEnabled();

    await act(async () => resolve());
    expect(getCheckbox()).toBeChecked();
  });

  it('should roll back and show a toast if the toggleRecipeMade action fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockToggleRecipeMade.mockRejectedValue(
      new Error('Failed to toggle recipe made'),
    );

    render(<MadeCheckbox {...defaultProps} />);

    await act(async () => {
      fireEvent.click(getCheckbox());
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      new Error('Failed to toggle recipe made'),
    );
    expect(mockShowToast).toHaveBeenCalledWith(
      "Couldn't save. Please try again!",
    );
    expect(getCheckbox()).not.toBeChecked();
    consoleErrorSpy.mockRestore();
  });
});
