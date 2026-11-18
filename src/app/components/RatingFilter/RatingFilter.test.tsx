import { act, fireEvent, screen } from '@testing-library/react';

import { renderInForm } from '../testUtils';
import RatingFilter from './RatingFilter';

describe('RatingFilter', () => {
  const star = (n: number) =>
    screen.getByRole('radio', { name: new RegExp(`^${n} stars?$`) });

  it('renders the label and five star options', () => {
    renderInForm((formRef) => (
      <RatingFilter
        ratingInitialValue={0}
        updateActiveFilters={jest.fn()}
        formRef={formRef}
      />
    ));

    expect(screen.getByText('Minimum Rating')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('selects the initial rating', () => {
    renderInForm((formRef) => (
      <RatingFilter
        ratingInitialValue={3}
        updateActiveFilters={jest.fn()}
        formRef={formRef}
      />
    ));
    expect(star(3)).toBeChecked();
  });

  it('reports the filter as active when a rating is chosen', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <RatingFilter
        ratingInitialValue={0}
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.click(star(4));
    expect(star(4)).toBeChecked();
    expect(update).toHaveBeenLastCalledWith('rating', true);
  });

  it('removes its reset listener on unmount', () => {
    const update = jest.fn();
    const { container, unmount } = renderInForm((formRef) => (
      <RatingFilter
        ratingInitialValue={4}
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));
    const form = container.querySelector('form')!;
    act(() => form.reset());
    expect(update).toHaveBeenCalledTimes(1);

    unmount();
    update.mockClear();
    act(() => form.reset());
    expect(update).not.toHaveBeenCalled();
  });

  it('clears the rating when the form is reset', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <RatingFilter
        ratingInitialValue={4}
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(star(4)).not.toBeChecked();
    expect(update).toHaveBeenLastCalledWith('rating', false);
  });
});
