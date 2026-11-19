import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { addIngredient, updateIngredient } from '@/lib/actions/ingredients';

import IngredientEntry, { IngredientEntryType } from './IngredientEntry';

jest.mock('@/lib/actions/ingredients', () => ({
  addIngredient: jest.fn(),
  updateIngredient: jest.fn(),
}));

const parentOptions = [
  { value: 'p1', label: 'Flour' },
  { value: 'p2', label: 'Sugar' },
];
const categories = ['Baking', 'Dairy'];

const existing: IngredientEntryType = {
  id: 'i1',
  name: 'Bread Flour',
  category: 'Baking',
  parentId: 'p1',
};

describe('IngredientEntry', () => {
  const setup = (ingredient: IngredientEntryType, parentName?: string) => {
    const setIngredients = jest.fn();
    render(
      <ul>
        <IngredientEntry
          ingredient={ingredient}
          parentOptions={parentOptions}
          categories={categories}
          parentName={parentName}
          setIngredients={setIngredients}
        />
      </ul>,
    );
    return { setIngredients };
  };

  const nameInput = () => screen.getByRole('textbox', { name: 'Name' });
  const parentSelect = () => screen.getByRole('combobox', { name: 'Parent' });
  const categorySelect = () =>
    screen.getByRole('combobox', { name: 'Category' });
  const save = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows name, category and parent in read mode', () => {
    setup(existing, 'Flour');

    expect(screen.getByText('Bread Flour')).toBeInTheDocument();
    expect(screen.getByText(/Baking · child of Flour/)).toBeInTheDocument();
  });

  it('omits the parent text when there is no parent', () => {
    setup({ ...existing, parentId: '' });

    expect(screen.queryByText(/child of/)).not.toBeInTheDocument();
  });

  it('starts in edit mode for a new ingredient', () => {
    setup({ id: 'new-1', name: '', category: '', parentId: '', isNew: true });

    expect(nameInput()).toHaveValue('');
    expect(parentSelect()).toHaveValue('');
    expect(categorySelect()).toHaveValue('');
  });

  it('populates the form from the ingredient when editing', () => {
    setup(existing, 'Flour');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(nameInput()).toHaveValue('Bread Flour');
    expect(parentSelect()).toHaveValue('p1');
    expect(categorySelect()).toHaveValue('Baking');
  });

  it('discards edits on cancel', () => {
    const { setIngredients } = setup(existing, 'Flour');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(nameInput(), { target: { value: 'Changed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('Bread Flour')).toBeInTheDocument();
    expect(setIngredients).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(nameInput()).toHaveValue('Bread Flour');
  });

  it('removes a new ingredient from the list on cancel', () => {
    const { setIngredients } = setup({
      id: 'new-1',
      name: '',
      category: '',
      parentId: '',
      isNew: true,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    const updater = setIngredients.mock.calls[0][0];
    expect(updater([existing, { ...existing, id: 'new-1' }])).toEqual([
      existing,
    ]);
  });

  it('requires a name and category', () => {
    setup({ id: 'new-1', name: '', category: '', parentId: '', isNew: true });

    fireEvent.change(nameInput(), { target: { value: 'Butter' } });
    save();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Name and category are required',
    );
    expect(addIngredient).not.toHaveBeenCalled();
  });

  it('updates an existing ingredient and the list', async () => {
    (updateIngredient as jest.Mock).mockResolvedValue(undefined);
    const { setIngredients } = setup(existing, 'Flour');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(nameInput(), { target: { value: '  AP Flour ' } });
    fireEvent.change(categorySelect(), { target: { value: 'Dairy' } });
    fireEvent.change(parentSelect(), { target: { value: 'p2' } });
    save();

    const expected = { name: 'AP Flour', category: 'Dairy', parentId: 'p2' };
    await waitFor(() =>
      expect(updateIngredient).toHaveBeenCalledWith('i1', expected),
    );
    await waitFor(() => expect(setIngredients).toHaveBeenCalled());
    const updater = setIngredients.mock.calls[0][0];
    expect(updater([existing, { ...existing, id: 'other' }])).toEqual([
      { ...existing, ...expected },
      { ...existing, id: 'other' },
    ]);
  });

  it('adds a new ingredient and replaces the temporary entry', async () => {
    const saved = {
      id: 'real-1',
      name: 'Butter',
      category: 'Dairy',
      parentId: '',
    };
    (addIngredient as jest.Mock).mockResolvedValue(saved);
    const { setIngredients } = setup({
      id: 'new-1',
      name: '',
      category: '',
      parentId: '',
      isNew: true,
    });

    fireEvent.change(nameInput(), { target: { value: 'Butter' } });
    fireEvent.change(categorySelect(), { target: { value: 'Dairy' } });
    save();

    await waitFor(() =>
      expect(addIngredient).toHaveBeenCalledWith({
        name: 'Butter',
        category: 'Dairy',
        parentId: '',
      }),
    );
    await waitFor(() => expect(setIngredients).toHaveBeenCalled());
    const updater = setIngredients.mock.calls[0][0];
    expect(
      updater([existing, { id: 'new-1', isNew: true } as IngredientEntryType]),
    ).toEqual([existing, { ...saved, isNew: false }]);
  });

  it('shows an error and stays in edit mode when saving fails', async () => {
    (updateIngredient as jest.Mock).mockRejectedValue(new Error('duplicate'));
    setup(existing, 'Flour');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(nameInput(), { target: { value: 'Rye Flour' } });
    save();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save. It may already exist.',
    );
    expect(nameInput()).toBeInTheDocument();
  });
});
