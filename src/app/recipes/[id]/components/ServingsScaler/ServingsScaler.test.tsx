import { fireEvent, render, screen } from '@testing-library/react';

import ServingsScaler from './ServingsScaler';

describe('ServingsScaler', () => {
  it('shows the current servings', () => {
    render(
      <ServingsScaler baseServings={4} servings={6} onChange={jest.fn()} />,
    );
    expect(screen.getByText('6 servings')).toBeInTheDocument();
  });

  it('increases and decreases servings by one', () => {
    const onChange = jest.fn();
    render(
      <ServingsScaler baseServings={4} servings={4} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Increase servings' }));
    expect(onChange).toHaveBeenLastCalledWith(5);

    fireEvent.click(screen.getByRole('button', { name: 'Decrease servings' }));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it('does not allow fewer than one serving', () => {
    render(
      <ServingsScaler baseServings={4} servings={1} onChange={jest.fn()} />,
    );
    expect(
      screen.getByRole('button', { name: 'Decrease servings' }),
    ).toBeDisabled();
  });

  it('applies presets relative to the base servings', () => {
    const onChange = jest.fn();
    render(
      <ServingsScaler baseServings={4} servings={4} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '2x' }));
    expect(onChange).toHaveBeenLastCalledWith(8);

    fireEvent.click(screen.getByRole('button', { name: '½x' }));
    expect(onChange).toHaveBeenLastCalledWith(2);
  });
});
