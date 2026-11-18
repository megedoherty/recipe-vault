import { fireEvent, screen } from '@testing-library/react';

import { renderInForm } from '../testUtils';
import AllUsersFilter from './AllUsersFilter';

describe('AllUsersFilter', () => {
  const checkbox = () =>
    screen.getByRole('checkbox', { name: "Show all users' recipes" });

  it('reflects the initial value', () => {
    renderInForm((formRef) => (
      <AllUsersFilter
        initialValue
        updateActiveFilters={jest.fn()}
        formRef={formRef}
      />
    ));
    expect(checkbox()).toBeChecked();
  });

  it('reports changes to the parent', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <AllUsersFilter
        initialValue={false}
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.click(checkbox());
    expect(checkbox()).toBeChecked();
    expect(update).toHaveBeenLastCalledWith('includeAllUsers', true);

    fireEvent.click(checkbox());
    expect(checkbox()).not.toBeChecked();
    expect(update).toHaveBeenLastCalledWith('includeAllUsers', false);
  });

  it('submits "true" as its value when checked', () => {
    renderInForm((formRef) => (
      <AllUsersFilter
        initialValue
        updateActiveFilters={jest.fn()}
        formRef={formRef}
      />
    ));

    expect(checkbox()).toHaveAttribute('name', 'includeAllUsers');
    expect(checkbox()).toHaveAttribute('value', 'true');
  });

  it('clears itself when the form is reset', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <AllUsersFilter
        initialValue
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(checkbox()).not.toBeChecked();
    expect(update).toHaveBeenLastCalledWith('includeAllUsers', false);
  });
});
