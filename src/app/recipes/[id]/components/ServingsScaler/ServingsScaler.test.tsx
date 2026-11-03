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

  describe('custom scale', () => {
    const ingredients = [
      { id: 'a', name: 'cream cheese', quantity: '8 oz' },
      { id: 'b', name: 'sugar', quantity: '1/2 cup' },
      { id: 'c', name: 'salt', quantity: 'pinch' },
    ];

    beforeEach(() => {
      HTMLDialogElement.prototype.showModal = jest.fn();
      HTMLDialogElement.prototype.close = jest.fn();
    });

    it('hides the custom button when no ingredient has an exact amount', () => {
      render(
        <ServingsScaler
          baseServings={4}
          servings={4}
          ingredients={[{ id: 'c', name: 'salt', quantity: 'pinch' }]}
          onChange={jest.fn()}
        />,
      );
      expect(
        screen.queryByRole('button', { name: 'Custom' }),
      ).not.toBeInTheDocument();
    });

    it('scales servings so the chosen ingredient matches what you have', () => {
      const onChange = jest.fn();
      render(
        <ServingsScaler
          baseServings={4}
          servings={4}
          ingredients={ingredients}
          onChange={onChange}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
      fireEvent.change(screen.getByLabelText('Amount you have (oz)'), {
        target: { value: '7' },
      });
      fireEvent.click(
        screen.getByRole('button', { name: 'Scale', hidden: true }),
      );

      expect(onChange).toHaveBeenCalledWith(3.5);
    });

    it('lets you pick a different ingredient', () => {
      const onChange = jest.fn();
      render(
        <ServingsScaler
          baseServings={4}
          servings={4}
          ingredients={ingredients}
          onChange={onChange}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
      fireEvent.change(
        screen.getByLabelText('Ingredient', { selector: 'select' }),
        {
          target: { value: 'b' },
        },
      );
      fireEvent.change(screen.getByLabelText('Amount you have (cup)'), {
        target: { value: '1' },
      });
      fireEvent.click(
        screen.getByRole('button', { name: 'Scale', hidden: true }),
      );

      expect(onChange).toHaveBeenCalledWith(8);
    });

    it('does not scale without a valid amount', () => {
      render(
        <ServingsScaler
          baseServings={4}
          servings={4}
          ingredients={ingredients}
          onChange={jest.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
      expect(
        screen.getByRole('button', { name: 'Scale', hidden: true }),
      ).toBeDisabled();
    });
  });
});
