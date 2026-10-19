import { fireEvent, render, screen } from '@testing-library/react';

import Input from './Input';

describe('Input', () => {
  it('should render an input associated with its label', () => {
    render(<Input label="Title" name="title" id="title" type="text" />);
    const input = screen.getByLabelText('Title');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('name', 'title');
    expect(input).toHaveAttribute('type', 'text');
  });

  it.each(['url', 'email', 'password', 'number'] as const)(
    'should render an input of type %s',
    (type) => {
      render(<Input label="Field" name="field" id="field" type={type} />);
      expect(screen.getByLabelText('Field')).toHaveAttribute('type', type);
    },
  );

  it('should render a textarea when type is textarea', () => {
    render(<Input label="Notes" name="notes" id="notes" type="textarea" />);
    const textarea = screen.getByLabelText('Notes');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).not.toHaveAttribute('type');
  });

  it('should call onChange when the user types', () => {
    const onChange = jest.fn();
    render(
      <Input
        label="Title"
        name="title"
        id="title"
        type="text"
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'abc' },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Title')).toHaveValue('abc');
  });

  it('should visually hide the label when hideLabel is true', () => {
    render(
      <Input label="Title" name="title" id="title" type="text" hideLabel />,
    );
    expect(screen.getByText('Title')).toHaveClass('sr-only');
  });

  it('should not hide the label by default', () => {
    render(<Input label="Title" name="title" id="title" type="text" />);
    expect(screen.getByText('Title')).not.toHaveClass('sr-only');
  });

  it('should apply containerClassName to the container', () => {
    const { container } = render(
      <Input
        label="Title"
        name="title"
        id="title"
        type="text"
        containerClassName="custom-container"
      />,
    );
    expect(container.firstChild).toHaveClass('custom-container');
  });

  it('should apply inputClassName to the input', () => {
    render(
      <Input
        label="Title"
        name="title"
        id="title"
        type="text"
        inputClassName="custom-input"
      />,
    );
    expect(screen.getByLabelText('Title')).toHaveClass('custom-input');
  });

  it('should apply inputClassName to the textarea', () => {
    render(
      <Input
        label="Notes"
        name="notes"
        id="notes"
        type="textarea"
        inputClassName="custom-input"
      />,
    );
    expect(screen.getByLabelText('Notes')).toHaveClass('custom-input');
  });

  it('should pass through extra props', () => {
    render(
      <Input
        label="Title"
        name="title"
        id="title"
        type="text"
        placeholder="Enter title"
        required
      />,
    );
    const input = screen.getByLabelText('Title');
    expect(input).toHaveAttribute('placeholder', 'Enter title');
    expect(input).toBeRequired();
  });
});
