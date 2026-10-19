import { fireEvent, render, screen } from '@testing-library/react';

import Switch from './Switch';

describe('Switch', () => {
  it('should render a switch labelled by its label', () => {
    render(<Switch label="Cooking mode" />);
    expect(
      screen.getByRole('switch', { name: 'Cooking mode' }),
    ).toBeInTheDocument();
  });

  it('should toggle and call onChange when clicked', () => {
    const onChange = jest.fn();
    render(<Switch label="Cooking mode" onChange={onChange} />);
    const toggle = screen.getByRole('switch');

    fireEvent.click(toggle);

    expect(toggle).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should toggle when the label is clicked', () => {
    render(<Switch label="Cooking mode" />);
    fireEvent.click(screen.getByText('Cooking mode'));
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('should be disabled when disabled is set', () => {
    render(<Switch label="Cooking mode" disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
