import { act, fireEvent, render, screen } from '@testing-library/react';

import { toggleRecipeBookmarked } from '@/lib/actions/recipes';

import BookmarkButton from './BookmarkButton';

const mockShowToast = jest.fn();

jest.mock('@/components/molecules/Toast/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast, dismissToast: jest.fn() }),
}));

jest.mock('@/lib/actions/recipes', () => ({
  toggleRecipeBookmarked: jest.fn(),
}));

const mockToggle = toggleRecipeBookmarked as jest.MockedFunction<
  typeof toggleRecipeBookmarked
>;

const defaultProps = {
  recipeId: '1',
  initialBookmarked: false,
};

describe('BookmarkButton', () => {
  beforeEach(() => {
    mockToggle.mockReset();
    mockShowToast.mockReset();
  });

  it('should show an error toast when the action fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockToggle.mockRejectedValue(new Error('nope'));

    render(<BookmarkButton {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Bookmark recipe' }));
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      "Couldn't update bookmark. Please try again!",
    );
    consoleErrorSpy.mockRestore();
  });

  it('should not show a toast when the action succeeds', async () => {
    mockToggle.mockResolvedValue(undefined);
    render(<BookmarkButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Bookmark recipe' }));
    });
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('should render unpressed when not bookmarked', () => {
    render(<BookmarkButton {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: 'Bookmark recipe' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('should render pressed when bookmarked', () => {
    render(<BookmarkButton {...defaultProps} initialBookmarked />);
    expect(
      screen.getByRole('button', { name: 'Remove bookmark' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('should bookmark the recipe and update the button', async () => {
    mockToggle.mockResolvedValue(undefined);
    render(<BookmarkButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Bookmark recipe' }));
    });

    expect(mockToggle).toHaveBeenCalledWith('1', true);
    expect(
      screen.getByRole('button', { name: 'Remove bookmark' }),
    ).toBeInTheDocument();
  });

  it('should remove the bookmark when already bookmarked', async () => {
    mockToggle.mockResolvedValue(undefined);
    render(<BookmarkButton {...defaultProps} initialBookmarked />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove bookmark' }));
    });

    expect(mockToggle).toHaveBeenCalledWith('1', false);
    expect(
      screen.getByRole('button', { name: 'Bookmark recipe' }),
    ).toBeInTheDocument();
  });

  it('should keep the previous state and log if the action fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockToggle.mockRejectedValue(new Error('nope'));
    render(<BookmarkButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Bookmark recipe' }));
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Bookmark recipe' }),
    ).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('should update immediately, before the server responds, and stay enabled', async () => {
    let resolve: () => void = () => {};
    mockToggle.mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );
    render(<BookmarkButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Bookmark recipe' }));
    });

    const button = screen.getByRole('button', { name: 'Remove bookmark' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toBeEnabled();

    await act(async () => resolve());
    expect(
      screen.getByRole('button', { name: 'Remove bookmark' }),
    ).toBeInTheDocument();
  });

  it('should roll back to the last confirmed state when the action fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockToggle.mockRejectedValue(new Error('nope'));
    render(<BookmarkButton {...defaultProps} initialBookmarked />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove bookmark' }));
    });

    expect(
      screen.getByRole('button', { name: 'Remove bookmark' }),
    ).toHaveAttribute('aria-pressed', 'true');
    consoleErrorSpy.mockRestore();
  });

  it('should send each click in order when clicked quickly', async () => {
    // Server actions from one client resolve in the order they were sent
    const resolvers: Array<() => void> = [];
    mockToggle.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvers.push(resolve);
        }),
    );
    render(<BookmarkButton {...defaultProps} />);

    // The first request is still in flight when the second click happens
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Bookmark recipe' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove bookmark' }));
    });
    await act(async () => resolvers[0]());
    await act(async () => resolvers[1]());

    expect(mockToggle).toHaveBeenNthCalledWith(1, '1', true);
    expect(mockToggle).toHaveBeenNthCalledWith(2, '1', false);
    expect(
      screen.getByRole('button', { name: 'Bookmark recipe' }),
    ).toBeInTheDocument();
  });
});
