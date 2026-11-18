import { fireEvent, screen } from '@testing-library/react';

import { renderInForm } from '../testUtils';
import MadeFilter from './MadeFilter';

describe('MadeFilter', () => {
  const radio = (name: string) => screen.getByRole('radio', { name });

  it('renders All, Yes and No options inside a labelled group', () => {
    renderInForm((formRef) => (
      <MadeFilter updateActiveFilters={jest.fn()} formRef={formRef} />
    ));

    expect(
      screen.getByRole('group', { name: 'Recipes I made' }),
    ).toBeInTheDocument();
    expect(radio('All')).toBeInTheDocument();
    expect(radio('Yes')).toBeInTheDocument();
    expect(radio('No')).toBeInTheDocument();
  });

  it('has nothing selected without an initial value', () => {
    renderInForm((formRef) => (
      <MadeFilter updateActiveFilters={jest.fn()} formRef={formRef} />
    ));

    expect(radio('All')).not.toBeChecked();
    expect(radio('Yes')).not.toBeChecked();
    expect(radio('No')).not.toBeChecked();
  });

  it('selects the initial value', () => {
    renderInForm((formRef) => (
      <MadeFilter
        initialValue="no"
        updateActiveFilters={jest.fn()}
        formRef={formRef}
      />
    ));
    expect(radio('No')).toBeChecked();
  });

  it('marks the filter active for Yes and No', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <MadeFilter updateActiveFilters={update} formRef={formRef} />
    ));

    fireEvent.click(radio('Yes'));
    expect(radio('Yes')).toBeChecked();
    expect(update).toHaveBeenLastCalledWith('made', true);

    fireEvent.click(radio('No'));
    expect(radio('No')).toBeChecked();
    expect(update).toHaveBeenLastCalledWith('made', true);
  });

  it('marks the filter inactive for All', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <MadeFilter
        initialValue="yes"
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.click(radio('All'));
    expect(update).toHaveBeenLastCalledWith('made', false);
  });

  it('clears the selection when the form is reset', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <MadeFilter
        initialValue="yes"
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(radio('Yes')).not.toBeChecked();
    expect(update).toHaveBeenLastCalledWith('made', false);
  });
});
