import { fireEvent, screen } from '@testing-library/react';

import { renderInForm } from '../testUtils';
import ServingsFilter from './ServingsFilter';

describe('ServingsFilter', () => {
  const minInput = () =>
    screen.getByLabelText('Minimum number of servings') as HTMLInputElement;
  const maxInput = () =>
    screen.getByLabelText('Maximum number of servings') as HTMLInputElement;

  it('applies the servings range as min/max attributes', () => {
    renderInForm((formRef) => (
      <ServingsFilter
        servingsRange={{ min: 1, max: 12 }}
        updateActiveFilters={jest.fn()}
        formRef={formRef}
      />
    ));

    expect(minInput()).toHaveAttribute('min', '1');
    expect(minInput()).toHaveAttribute('max', '12');
    expect(maxInput()).toHaveAttribute('min', '1');
    expect(maxInput()).toHaveAttribute('max', '12');
  });

  it('shows the initial values', () => {
    renderInForm((formRef) => (
      <ServingsFilter
        servingsRange={{ min: 1, max: 12 }}
        minInitialValue={2}
        maxInitialValue={6}
        updateActiveFilters={jest.fn()}
        formRef={formRef}
      />
    ));

    expect(minInput()).toHaveValue(2);
    expect(maxInput()).toHaveValue(6);
  });

  it('reports each bound as active when it has a positive value', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <ServingsFilter
        servingsRange={{ min: 1, max: 12 }}
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.change(minInput(), { target: { value: '3' } });
    expect(update).toHaveBeenLastCalledWith('minServings', true);

    fireEvent.change(maxInput(), { target: { value: '8' } });
    expect(update).toHaveBeenLastCalledWith('maxServings', true);
  });

  it('reports a bound as inactive when cleared or zero', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <ServingsFilter
        servingsRange={{ min: 1, max: 12 }}
        minInitialValue={3}
        maxInitialValue={8}
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.change(minInput(), { target: { value: '' } });
    expect(update).toHaveBeenLastCalledWith('minServings', false);

    fireEvent.change(maxInput(), { target: { value: '0' } });
    expect(update).toHaveBeenLastCalledWith('maxServings', false);
  });

  it('shows no error when min is less than or equal to max', () => {
    renderInForm((formRef) => (
      <ServingsFilter
        servingsRange={{ min: 1, max: 12 }}
        minInitialValue={2}
        maxInitialValue={2}
        updateActiveFilters={jest.fn()}
        formRef={formRef}
      />
    ));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(minInput()).toHaveAttribute('aria-invalid', 'false');
  });

  it('shows no error when only one bound is set', () => {
    renderInForm((formRef) => (
      <ServingsFilter
        servingsRange={{ min: 1, max: 12 }}
        minInitialValue={5}
        updateActiveFilters={jest.fn()}
        formRef={formRef}
      />
    ));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error when min is greater than max', () => {
    renderInForm((formRef) => (
      <ServingsFilter
        servingsRange={{ min: 1, max: 12 }}
        minInitialValue={2}
        maxInitialValue={6}
        updateActiveFilters={jest.fn()}
        formRef={formRef}
      />
    ));

    fireEvent.change(minInput(), { target: { value: '9' } });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Minimum must be less than or equal to maximum. This filter will be ignored.',
    );
    expect(minInput()).toHaveAttribute('aria-invalid', 'true');
    expect(minInput()).toHaveAttribute('aria-describedby', 'servings-error');
    expect(maxInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears both values when the form is reset', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <ServingsFilter
        servingsRange={{ min: 1, max: 12 }}
        minInitialValue={2}
        maxInitialValue={6}
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(minInput()).toHaveValue(null);
    expect(maxInput()).toHaveValue(null);
    expect(update).toHaveBeenCalledWith('minServings', false);
    expect(update).toHaveBeenCalledWith('maxServings', false);
  });
});
