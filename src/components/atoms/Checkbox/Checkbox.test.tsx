import { fireEvent, render, screen } from '@testing-library/react';

import Checkbox from './Checkbox';

describe('Checkbox', () => {
  it('should render a checkbox labelled by its label', () => {
    render(<Checkbox label="Vegan" />);
    expect(screen.getByRole('checkbox', { name: 'Vegan' })).toBeInTheDocument();
  });

  it('should toggle and call onChange when clicked', () => {
    const onChange = jest.fn();
    render(<Checkbox label="Vegan" onChange={onChange} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Vegan' });

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should toggle when the label is clicked', () => {
    render(<Checkbox label="Vegan" />);
    fireEvent.click(screen.getByText('Vegan'));
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('should generate unique ids for multiple checkboxes', () => {
    render(
      <>
        <Checkbox label="One" />
        <Checkbox label="Two" />
      </>,
    );
    const [one, two] = screen.getAllByRole('checkbox');
    expect(one.id).not.toBe(two.id);
  });

  it('should pass through props such as disabled and defaultChecked', () => {
    render(<Checkbox label="Vegan" disabled defaultChecked />);
    const checkbox = screen.getByRole('checkbox', { name: 'Vegan' });
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeChecked();
  });

  it('should apply containerClassName to the container', () => {
    const { container } = render(
      <Checkbox label="Vegan" containerClassName="custom-container" />,
    );
    expect(container.firstChild).toHaveClass('custom-container');
  });

  it('should apply checkboxClassName to the input', () => {
    render(<Checkbox label="Vegan" checkboxClassName="custom-checkbox" />);
    expect(screen.getByRole('checkbox')).toHaveClass('custom-checkbox');
  });
});
