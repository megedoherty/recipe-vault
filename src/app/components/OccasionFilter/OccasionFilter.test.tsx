import { fireEvent, screen } from '@testing-library/react';

import { renderInForm } from '../testUtils';
import OccasionFilter from './OccasionFilter';

const occasions = [
  { id: 1, name: 'Birthday' },
  { id: 2, name: 'Holiday' },
];

describe('OccasionFilter', () => {
  const select = () => screen.getByRole('combobox', { name: 'Occasion' });

  it('lists the occasions plus an empty option', () => {
    renderInForm((formRef) => (
      <OccasionFilter
        occasions={occasions}
        initialValue=""
        updateActiveFilters={jest.fn()}
        formRef={formRef}
      />
    ));

    expect(
      screen.getByRole('option', { name: 'Select an occasion' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Birthday' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Holiday' })).toBeInTheDocument();
  });

  it('selects the initial value', () => {
    renderInForm((formRef) => (
      <OccasionFilter
        occasions={occasions}
        initialValue="2"
        updateActiveFilters={jest.fn()}
        formRef={formRef}
      />
    ));
    expect(select()).toHaveValue('2');
  });

  it('reports the filter as active when an occasion is chosen', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <OccasionFilter
        occasions={occasions}
        initialValue=""
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.change(select(), { target: { value: '1' } });
    expect(select()).toHaveValue('1');
    expect(update).toHaveBeenLastCalledWith('occasion', true);
  });

  it('reports the filter as inactive when the empty option is chosen', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <OccasionFilter
        occasions={occasions}
        initialValue="1"
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.change(select(), { target: { value: '' } });
    expect(update).toHaveBeenLastCalledWith('occasion', false);
  });

  it('clears the selection when the form is reset', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <OccasionFilter
        occasions={occasions}
        initialValue="2"
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(select()).toHaveValue('');
    expect(update).toHaveBeenLastCalledWith('occasion', false);
  });
});
