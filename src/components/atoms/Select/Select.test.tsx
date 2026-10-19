import { fireEvent, render, screen } from '@testing-library/react';

import Select from './Select';

const options = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'dinner', label: 'Dinner' },
];

describe('Select', () => {
  it('should render a select associated with its label', () => {
    render(<Select label="Meal" name="meal" id="meal" options={options} />);
    const select = screen.getByRole('combobox', { name: 'Meal' });
    expect(select).toHaveAttribute('name', 'meal');
  });

  it('should render all options', () => {
    render(<Select label="Meal" name="meal" id="meal" options={options} />);
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(
      screen.getByRole('option', { name: 'Breakfast' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dinner' })).toBeInTheDocument();
  });

  it('should render the empty option first when provided', () => {
    render(
      <Select
        label="Meal"
        name="meal"
        id="meal"
        options={options}
        emptyOption={{ value: '', label: 'Any meal' }}
      />,
    );
    const rendered = screen.getAllByRole('option');
    expect(rendered).toHaveLength(3);
    expect(rendered[0]).toHaveTextContent('Any meal');
    expect(rendered[0]).toHaveValue('');
  });

  it('should call onChange when an option is selected', () => {
    const onChange = jest.fn();
    render(
      <Select
        label="Meal"
        name="meal"
        id="meal"
        options={options}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'dinner' },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('combobox')).toHaveValue('dinner');
  });

  it('should visually hide the label when hideLabel is true', () => {
    render(
      <Select label="Meal" name="meal" id="meal" options={options} hideLabel />,
    );
    expect(screen.getByText('Meal')).toHaveClass('sr-only');
  });

  it('should not hide the label by default', () => {
    render(<Select label="Meal" name="meal" id="meal" options={options} />);
    expect(screen.getByText('Meal')).not.toHaveClass('sr-only');
  });

  it('should apply labelClassName to the label', () => {
    render(
      <Select
        label="Meal"
        name="meal"
        id="meal"
        options={options}
        labelClassName="custom-label"
      />,
    );
    expect(screen.getByText('Meal')).toHaveClass('custom-label');
  });

  it('should apply selectClassName to the select', () => {
    render(
      <Select
        label="Meal"
        name="meal"
        id="meal"
        options={options}
        selectClassName="custom-select"
      />,
    );
    expect(screen.getByRole('combobox')).toHaveClass('custom-select');
  });
  it('should pass through extra props', () => {
    render(
      <Select
        label="Meal"
        name="meal"
        id="meal"
        options={options}
        disabled
        defaultValue="dinner"
      />,
    );
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
    expect(select).toHaveValue('dinner');
  });
});
