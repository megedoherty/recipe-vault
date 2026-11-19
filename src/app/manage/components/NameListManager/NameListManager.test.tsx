import { fireEvent, render, screen } from '@testing-library/react';

import NameListManager from './NameListManager';

describe('NameListManager', () => {
  const setup = (entries = [{ id: 1, name: 'Dinner' }]) =>
    render(
      <NameListManager
        title="Categories"
        placeholder="Category Name"
        entries={entries}
        addEntry={jest.fn()}
        updateEntry={jest.fn()}
      />,
    );

  const addButton = () =>
    screen.getByRole('button', { name: 'Add Categories' });

  it('renders the title and an entry per item', () => {
    setup([
      { id: 1, name: 'Dinner' },
      { id: 2, name: 'Dessert' },
    ]);

    expect(
      screen.getByRole('heading', { name: 'Categories' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Dessert')).toBeInTheDocument();
  });

  it('adds an empty entry in edit mode and disables the add button', () => {
    setup();

    fireEvent.click(addButton());

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute(
      'placeholder',
      'Category Name',
    );
    expect(addButton()).toBeDisabled();
  });

  it('removes the new entry and re-enables add when cancelled', () => {
    setup();

    fireEvent.click(addButton());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(addButton()).toBeEnabled();
  });
});
