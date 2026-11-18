import { fireEvent, screen } from '@testing-library/react';

import { renderInForm } from '../testUtils';
import BookmarkedFilter from './BookmarkedFilter';

describe('BookmarkedFilter', () => {
  const checkbox = () =>
    screen.getByRole('checkbox', { name: 'Bookmarked recipes only' });

  it('reflects the initial value', () => {
    renderInForm((formRef) => (
      <BookmarkedFilter
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
      <BookmarkedFilter
        initialValue={false}
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.click(checkbox());
    expect(checkbox()).toBeChecked();
    expect(update).toHaveBeenLastCalledWith('bookmarked', true);

    fireEvent.click(checkbox());
    expect(checkbox()).not.toBeChecked();
    expect(update).toHaveBeenLastCalledWith('bookmarked', false);
  });

  it('submits "true" as its value when checked', () => {
    renderInForm((formRef) => (
      <BookmarkedFilter
        initialValue
        updateActiveFilters={jest.fn()}
        formRef={formRef}
      />
    ));

    expect(checkbox()).toHaveAttribute('name', 'bookmarked');
    expect(checkbox()).toHaveAttribute('value', 'true');
  });

  it('clears itself when the form is reset', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <BookmarkedFilter
        initialValue
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(checkbox()).not.toBeChecked();
    expect(update).toHaveBeenLastCalledWith('bookmarked', false);
  });
});
