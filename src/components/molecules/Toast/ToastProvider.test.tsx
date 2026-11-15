import { act, fireEvent, render, screen } from '@testing-library/react';

import ToastProvider, {
  MAX_TOASTS,
  TOAST_DURATION_MS,
  useToast,
} from './ToastProvider';

function Trigger({ message = 'Oops' }: { message?: string }) {
  const { showToast } = useToast();
  return <button onClick={() => showToast(message)}>show {message}</button>;
}

const renderWithProvider = (ui = <Trigger />) =>
  render(<ToastProvider>{ui}</ToastProvider>);

describe('ToastProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render a persistent live region, even with no toasts', () => {
    const { container } = renderWithProvider();
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });

  it('should show an error toast with role alert', () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole('button', { name: 'show Oops' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Oops');
  });

  it('should dismiss automatically after the duration', () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole('button', { name: 'show Oops' }));
    act(() => {
      jest.advanceTimersByTime(TOAST_DURATION_MS);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should dismiss when the dismiss button is clicked', () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole('button', { name: 'show Oops' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should not stack a duplicate message and should restart its timer', () => {
    renderWithProvider();
    const trigger = screen.getByRole('button', { name: 'show Oops' });
    fireEvent.click(trigger);
    act(() => {
      jest.advanceTimersByTime(TOAST_DURATION_MS - 1000);
    });
    fireEvent.click(trigger);
    expect(screen.getAllByRole('alert')).toHaveLength(1);

    act(() => {
      jest.advanceTimersByTime(TOAST_DURATION_MS - 1000);
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should keep only the newest toasts when over the cap', () => {
    renderWithProvider(
      <>
        {['a', 'b', 'c', 'd'].map((m) => (
          <Trigger key={m} message={m} />
        ))}
      </>,
    );
    ['a', 'b', 'c', 'd'].forEach((m) =>
      fireEvent.click(screen.getByRole('button', { name: `show ${m}` })),
    );
    expect(screen.getAllByRole('alert')).toHaveLength(MAX_TOASTS);
    expect(screen.queryByText('a')).not.toBeInTheDocument();
    expect(screen.getByText('d')).toBeInTheDocument();
  });

  it('should throw when useToast is used outside the provider', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    expect(() => render(<Trigger />)).toThrow(
      'useToast must be used within a ToastProvider',
    );
    consoleErrorSpy.mockRestore();
  });
});
