import { fireEvent, render, screen, within } from '@testing-library/react';

import { IngredientDb } from '@/types';

import IngredientManager from './IngredientManager';

jest.mock('@/lib/actions/ingredients', () => ({
  addIngredient: jest.fn(),
  updateIngredient: jest.fn(),
}));

const ingredients: IngredientDb[] = [
  { id: '1', name: 'Flour', category: 'Baking', parentId: '' },
  { id: '2', name: 'Bread Flour', category: 'Baking', parentId: '1' },
  { id: '3', name: 'Strong Bread Flour', category: 'Baking', parentId: '2' },
  { id: '4', name: 'Butter', category: 'Dairy', parentId: '' },
];

describe('IngredientManager', () => {
  const setup = (items = ingredients) =>
    render(
      <IngredientManager
        ingredients={items}
        categories={['Baking', 'Dairy']}
      />,
    );

  const addButton = () =>
    screen.getByRole('button', { name: 'Add Ingredient' });
  const search = () =>
    screen.getByRole('textbox', { name: 'Search ingredients' });

  it('lists all ingredients, with parent names', () => {
    setup();

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText(/Baking · child of Flour$/)).toBeInTheDocument();
    expect(
      screen.getByText(/Baking · child of Bread Flour$/),
    ).toBeInTheDocument();
  });

  it('filters by search term, case-insensitively', () => {
    setup();

    fireEvent.change(search(), { target: { value: '  BREAD ' } });

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText('Butter')).not.toBeInTheDocument();
  });

  it('shows an empty message when nothing matches', () => {
    setup();

    fireEvent.change(search(), { target: { value: 'zzz' } });

    expect(screen.getByText('No ingredients found')).toBeInTheDocument();
  });

  it('adds a new entry at the top and disables the add button', () => {
    setup();

    fireEvent.click(addButton());

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(
      within(items[0]).getByRole('textbox', { name: 'Name' }),
    ).toBeInTheDocument();
    expect(addButton()).toBeDisabled();
  });

  it('keeps the new entry visible while a search filters others out', () => {
    setup();

    fireEvent.click(addButton());
    fireEvent.change(search(), { target: { value: 'butter' } });

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText('No ingredients found')).not.toBeInTheDocument();
  });

  it('re-enables add after the new entry is cancelled', () => {
    setup();

    fireEvent.click(addButton());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(addButton()).toBeEnabled();
  });

  it('excludes an ingredient and its descendants from its parent options', () => {
    setup();

    // Edit "Bread Flour" (id 2): excluded = itself and "Strong Bread Flour"
    const item = screen
      .getAllByRole('listitem')
      .find((li) => within(li).queryByText('Bread Flour'))!;
    fireEvent.click(within(item).getByRole('button', { name: 'Edit' }));

    const options = within(
      within(item).getByRole('combobox', { name: 'Parent' }),
    )
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toEqual(['No parent', 'Flour', 'Butter']);
  });
});
