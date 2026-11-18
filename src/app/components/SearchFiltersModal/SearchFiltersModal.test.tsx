import { fireEvent, screen } from '@testing-library/react';
import { ComponentProps } from 'react';

import { renderInForm } from '../testUtils';
import SearchFiltersModal from './SearchFiltersModal';

const ingredients = [
  {
    id: 'egg',
    name: 'Egg',
    category: 'Eggs',
    childrenIds: [],
    parentIds: [],
    depth: 0,
  },
];
const equipment = [{ id: 'e1', name: 'Blender' }];
const occasions = [{ id: 1, name: 'Birthday' }];

type Overrides = Partial<ComponentProps<typeof SearchFiltersModal>>;

const renderModal = (overrides: Overrides = {}) =>
  renderInForm((formRef) => (
    <SearchFiltersModal
      ingredients={ingredients}
      equipment={equipment}
      excludeIngredientsInitialValue={[]}
      includeIngredientsInitialValue={[]}
      equipmentIdsInitialValue={[]}
      servingsRange={{ min: 1, max: 12 }}
      occasions={occasions}
      occasionIdInitialValue=""
      includeAllUsersInitialValue={false}
      bookmarkedInitialValue={false}
      {...overrides}
      formRef={formRef}
    />
  ));

describe('SearchFiltersModal', () => {
  it('shows the button without a count when no filters are active', () => {
    renderModal();

    expect(
      screen.getByRole('button', { name: 'More Filters' }),
    ).toBeInTheDocument();
  });

  it('counts the filters that are active from initial values', () => {
    renderModal({
      includeIngredientsInitialValue: ['egg'],
      excludeIngredientsInitialValue: ['egg'],
      equipmentIdsInitialValue: ['e1'],
      minServingsInitialValue: 2,
      maxServingsInitialValue: 6,
      madeInitialValue: 'yes',
      occasionIdInitialValue: '1',
      includeAllUsersInitialValue: true,
      bookmarkedInitialValue: true,
    });

    expect(
      screen.getByRole('button', { name: 'More Filters (9)' }),
    ).toBeInTheDocument();
  });

  it('opens the dialog when the button is clicked', () => {
    renderModal();
    expect(
      screen.queryByRole('heading', { name: 'Additional Filters' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'More Filters' }));

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { name: 'Additional Filters' }),
    ).toBeInTheDocument();
  });

  it('closes the dialog from the close button', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'More Filters' }));

    // The icon-only close button is the first button in the dialog header
    const heading = screen.getByRole('heading', { name: 'Additional Filters' });
    const closeButton = heading.parentElement!.querySelector('button')!;
    fireEvent.click(closeButton);

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });

  it('renders every filter inside the dialog', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'More Filters' }));

    expect(
      screen.getByRole('checkbox', { name: "Show all users' recipes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Bookmarked recipes only' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Recipes I made' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Minimum Rating')).toBeInTheDocument();
    expect(screen.getByText('Number of servings')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Include Ingredients' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Exclude Ingredients' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Equipment' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Occasion' }),
    ).toBeInTheDocument();
  });

  it('updates the active count as filters change', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'More Filters' }));

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Bookmarked recipes only' }),
    );
    expect(
      screen.getByRole('button', { name: 'More Filters (1)' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    expect(
      screen.getByRole('button', { name: 'More Filters (2)' }),
    ).toBeInTheDocument();

    // Selecting the same filter twice must not double count it
    fireEvent.click(screen.getByRole('radio', { name: 'No' }));
    expect(
      screen.getByRole('button', { name: 'More Filters (2)' }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Bookmarked recipes only' }),
    );
    expect(
      screen.getByRole('button', { name: 'More Filters (1)' }),
    ).toBeInTheDocument();
  });

  it('resets the active count when the form is reset', () => {
    renderModal({ bookmarkedInitialValue: true, madeInitialValue: 'yes' });
    expect(
      screen.getByRole('button', { name: 'More Filters (2)' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(
      screen.getByRole('button', { name: 'More Filters' }),
    ).toBeInTheDocument();
  });
});
