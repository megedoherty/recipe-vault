import { fireEvent, render, screen } from '@testing-library/react';

import { CombinedIngredients } from '@/lib/utils/shoppingListSwaps';

import IngredientSwapPicker from './IngredientSwapPicker';

const target: CombinedIngredients = {
  ingredientId: '10',
  name: 'milk',
  category: 'Dairy',
  quantity: 1,
  unit: 'cup',
  sourceIngredients: [],
};

const options = [
  { id: '1', name: 'egg', category: 'Eggs' },
  { id: '10', name: 'milk', category: 'Dairy' },
  { id: '11', name: 'oat milk', category: 'Dairy' },
];

describe('IngredientSwapPicker', () => {
  it('lists the target category first and marks the current ingredient', () => {
    render(
      <IngredientSwapPicker
        target={target}
        options={options}
        isSwapped={false}
        onChoose={jest.fn()}
      />,
    );

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(['Dairy', 'Eggs']);
    expect(screen.getByRole('button', { name: 'milk' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('filters options as you type, ignoring case', () => {
    render(
      <IngredientSwapPicker
        target={target}
        options={options}
        isSwapped={false}
        onChoose={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'OAT' } });

    expect(
      screen.getByRole('button', { name: 'oat milk' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'egg' }),
    ).not.toBeInTheDocument();
  });

  it('shows a message when nothing matches', () => {
    render(
      <IngredientSwapPicker
        target={target}
        options={options}
        isSwapped={false}
        onChoose={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'zzz' } });

    expect(screen.getByText('No ingredients found')).toBeInTheDocument();
  });

  it('calls onChoose with the option id', () => {
    const onChoose = jest.fn();
    render(
      <IngredientSwapPicker
        target={target}
        options={options}
        isSwapped={false}
        onChoose={onChoose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'oat milk' }));

    expect(onChoose).toHaveBeenCalledWith('11');
  });

  it('only offers "Use original ingredient" when swapped, and passes an empty id', () => {
    const onChoose = jest.fn();
    const { rerender } = render(
      <IngredientSwapPicker
        target={target}
        options={options}
        isSwapped={false}
        onChoose={onChoose}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Use original ingredient' }),
    ).not.toBeInTheDocument();

    rerender(
      <IngredientSwapPicker
        target={target}
        options={options}
        isSwapped
        onChoose={onChoose}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Use original ingredient' }),
    );

    expect(onChoose).toHaveBeenCalledWith('');
  });
});
