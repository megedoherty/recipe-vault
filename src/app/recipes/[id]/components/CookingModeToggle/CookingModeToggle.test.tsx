import { act, fireEvent, render, screen } from '@testing-library/react';

import CookingModeToggle from './CookingModeToggle';

describe('CookingModeToggle', () => {
  const release = jest.fn().mockResolvedValue(undefined);
  const request = jest.fn();

  beforeEach(() => {
    release.mockClear();
    request.mockReset().mockResolvedValue({ release });
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request },
      configurable: true,
    });
  });

  afterEach(() => {
    // @ts-expect-error cleaning up the mock
    delete navigator.wakeLock;
  });

  it('should render nothing when the Wake Lock API is unsupported', () => {
    // @ts-expect-error simulating an unsupported browser
    delete navigator.wakeLock;
    render(<CookingModeToggle />);
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('should request a screen wake lock when toggled on', async () => {
    render(<CookingModeToggle />);
    const toggle = screen.getByRole('switch', { name: 'Cooking mode' });
    expect(toggle).not.toBeChecked();

    await act(async () => fireEvent.click(toggle));

    expect(request).toHaveBeenCalledWith('screen');
    expect(toggle).toBeChecked();
  });

  it('should release the wake lock when toggled off', async () => {
    render(<CookingModeToggle />);
    const toggle = screen.getByRole('switch', { name: 'Cooking mode' });

    await act(async () => fireEvent.click(toggle));
    await act(async () => fireEvent.click(toggle));

    expect(release).toHaveBeenCalled();
    expect(toggle).not.toBeChecked();
  });

  it('should stay off if the request is rejected', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    request.mockRejectedValue(new Error('denied'));
    render(<CookingModeToggle />);
    const toggle = screen.getByRole('switch', { name: 'Cooking mode' });

    await act(async () => fireEvent.click(toggle));

    expect(toggle).not.toBeChecked();
  });

  it('should re-acquire the lock when the tab becomes visible again', async () => {
    render(<CookingModeToggle />);
    await act(async () =>
      fireEvent.click(screen.getByRole('switch', { name: 'Cooking mode' })),
    );
    expect(request).toHaveBeenCalledTimes(1);

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(request).toHaveBeenCalledTimes(2);
  });

  it('should release the lock on unmount', async () => {
    const { unmount } = render(<CookingModeToggle />);
    await act(async () =>
      fireEvent.click(screen.getByRole('switch', { name: 'Cooking mode' })),
    );

    unmount();

    expect(release).toHaveBeenCalled();
  });
});
