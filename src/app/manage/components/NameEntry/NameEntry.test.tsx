import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import NameEntry, { NameEntryType } from './NameEntry';

describe('NameEntry', () => {
  const setup = (
    entry: NameEntryType,
    overrides: {
      addEntry?: jest.Mock;
      updateEntry?: jest.Mock;
    } = {},
  ) => {
    const addEntry = overrides.addEntry ?? jest.fn();
    const updateEntry = overrides.updateEntry ?? jest.fn();
    const setEntries = jest.fn();
    render(
      <ul>
        <NameEntry
          entry={entry}
          placeholder="Category Name"
          addEntry={addEntry}
          updateEntry={updateEntry}
          setEntries={setEntries}
        />
      </ul>,
    );
    return { addEntry, updateEntry, setEntries };
  };

  const input = () => screen.getByRole('textbox', { name: 'Name' });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows an existing entry in read mode', () => {
    setup({ id: 1, name: 'Dinner' });

    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('starts in edit mode for a new entry', () => {
    setup({ id: 5, name: '', isNew: true });

    expect(input()).toHaveAttribute('placeholder', 'Category Name');
  });

  it('switches to edit mode and cancels back to the original name', () => {
    const { setEntries } = setup({ id: 1, name: 'Dinner' });

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(input(), { target: { value: 'Changed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(setEntries).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(input()).toHaveValue('Dinner');
  });

  it('removes a new entry from the list when cancelled', () => {
    const { setEntries } = setup({ id: 5, name: '', isNew: true });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    const updater = setEntries.mock.calls[0][0];
    expect(
      updater([
        { id: 1, name: 'Dinner' },
        { id: 5, name: '', isNew: true },
      ]),
    ).toEqual([{ id: 1, name: 'Dinner' }]);
  });

  it('requires a name', () => {
    const { addEntry, updateEntry } = setup({ id: 1, name: 'Dinner' });

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(input(), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
    expect(addEntry).not.toHaveBeenCalled();
    expect(updateEntry).not.toHaveBeenCalled();
    expect(input()).toBeInTheDocument();
  });

  it('updates an existing entry with the trimmed name', async () => {
    const updateEntry = jest.fn().mockResolvedValue(undefined);
    setup({ id: 1, name: 'Dinner' }, { updateEntry });

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(input(), { target: { value: '  Lunch  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateEntry).toHaveBeenCalledWith(1, 'Lunch'));
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('adds a new entry and swaps the temporary id for the saved one', async () => {
    const addEntry = jest.fn().mockResolvedValue({ id: 42, name: 'Brunch' });
    const { setEntries } = setup(
      { id: 5, name: '', isNew: true },
      { addEntry },
    );

    fireEvent.change(input(), { target: { value: 'Brunch' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(addEntry).toHaveBeenCalledWith('Brunch'));
    await waitFor(() => expect(setEntries).toHaveBeenCalled());

    const updater = setEntries.mock.calls[0][0];
    expect(
      updater([
        { id: 1, name: 'Dinner' },
        { id: 5, name: 'Brunch', isNew: true },
      ]),
    ).toEqual([
      { id: 1, name: 'Dinner' },
      { id: 42, name: 'Brunch', isNew: false },
    ]);
  });

  it('does not touch the list when add returns null', async () => {
    const addEntry = jest.fn().mockResolvedValue(null);
    const { setEntries } = setup(
      { id: 5, name: '', isNew: true },
      { addEntry },
    );

    fireEvent.change(input(), { target: { value: 'Brunch' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(addEntry).toHaveBeenCalled());
    expect(setEntries).not.toHaveBeenCalled();
  });

  it('shows an error and returns to edit mode when saving fails', async () => {
    const updateEntry = jest.fn().mockRejectedValue(new Error('duplicate'));
    setup({ id: 1, name: 'Dinner' }, { updateEntry });

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(input(), { target: { value: 'Lunch' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save. It may already exist.',
    );
    expect(input()).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it('clears a previous error when cancelling', () => {
    setup({ id: 1, name: 'Dinner' });

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(input(), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
