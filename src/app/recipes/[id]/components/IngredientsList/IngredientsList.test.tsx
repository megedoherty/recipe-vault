import { render, screen } from '@testing-library/react';

import { RecipeIngredientDisplay } from '@/types';

import IngredientsList from './IngredientsList';

const ingredient = (
  id: string,
  name: string,
  quantity: string | null,
): RecipeIngredientDisplay => ({
  id,
  name,
  quantity,
  normalizedIngredientId: null,
  normalizedIngredientName: null,
  category: 'Other',
});

const ingredients = [
  ingredient('1', 'flour', '2 cups'),
  ingredient('2', 'salt', null),
];

describe('IngredientsList', () => {
  it('labels each checkbox with its quantity and name', () => {
    render(
      <IngredientsList ingredients={ingredients} selectedIngredients={[]} />,
    );

    expect(
      screen.getByRole('checkbox', { name: '2 cups flour' }),
    ).toBeInTheDocument();
  });

  it('omits the quantity when there is none', () => {
    render(
      <IngredientsList ingredients={ingredients} selectedIngredients={[]} />,
    );

    expect(screen.getByRole('checkbox', { name: 'salt' })).toBeInTheDocument();
  });

  it('highlights only the selected ingredients', () => {
    render(
      <IngredientsList ingredients={ingredients} selectedIngredients={['1']} />,
    );

    const [flour, salt] = screen.getAllByRole('listitem');
    expect(flour.querySelector('.selected')).not.toBeNull();
    expect(salt.querySelector('.selected')).toBeNull();
  });

  it('registers each item element, and unregisters on unmount', () => {
    const registerItem = jest.fn();
    const { unmount } = render(
      <IngredientsList
        ingredients={ingredients}
        selectedIngredients={[]}
        registerItem={registerItem}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(registerItem).toHaveBeenCalledWith('1', items[0]);
    expect(registerItem).toHaveBeenCalledWith('2', items[1]);

    unmount();
    expect(registerItem).toHaveBeenCalledWith('1', null);
    expect(registerItem).toHaveBeenCalledWith('2', null);
  });
});
