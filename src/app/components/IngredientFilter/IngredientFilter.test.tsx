import { fireEvent, screen } from '@testing-library/react';

import { IngredientForSearch } from '@/types';

import { renderInForm } from '../testUtils';
import IngredientFilter from './IngredientFilter';

// milk > skim milk (child), egg is unrelated
const ingredients: IngredientForSearch[] = [
  {
    id: 'milk',
    name: 'Milk',
    category: 'Dairy',
    childrenIds: ['skim'],
    parentIds: [],
    depth: 0,
  },
  {
    id: 'skim',
    name: 'Skim milk',
    category: 'Dairy',
    childrenIds: [],
    parentIds: ['milk'],
    depth: 1,
  },
  {
    id: 'egg',
    name: 'Egg',
    category: 'Eggs',
    childrenIds: [],
    parentIds: [],
    depth: 0,
  },
];

const hiddenInput = (container: HTMLElement, name: string) =>
  container.querySelector(`input[name="${name}"]`) as HTMLInputElement;

const open = (label: string) =>
  fireEvent.click(screen.getByRole('button', { name: label }));

describe('IngredientFilter', () => {
  it('uses the type for the button label and hidden input name', () => {
    const { container, rerender } = renderInForm((formRef) => (
      <IngredientFilter
        ingredients={ingredients}
        type="Include"
        formRef={formRef}
      />
    ));

    expect(
      screen.getByRole('button', { name: 'Include Ingredients' }),
    ).toBeInTheDocument();
    expect(hiddenInput(container, 'includeIngredients')).toBeInTheDocument();

    rerender((formRef) => (
      <IngredientFilter
        ingredients={ingredients}
        type="Exclude"
        formRef={formRef}
      />
    ));
    expect(
      screen.getByRole('button', { name: 'Exclude Ingredients' }),
    ).toBeInTheDocument();
    expect(hiddenInput(container, 'excludeIngredients')).toBeInTheDocument();
  });

  it('shows the selected count and hidden value for initial values', () => {
    const { container } = renderInForm((formRef) => (
      <IngredientFilter
        type="Include"
        ingredients={ingredients}
        initialValue={['egg']}
        formRef={formRef}
      />
    ));

    expect(
      screen.getByRole('button', { name: 'Include Ingredients (1)' }),
    ).toBeInTheDocument();
    expect(hiddenInput(container, 'includeIngredients').value).toBe('egg');
  });

  it('groups ingredients by category', () => {
    renderInForm((formRef) => (
      <IngredientFilter
        type="Include"
        ingredients={ingredients}
        formRef={formRef}
      />
    ));
    open('Include Ingredients');

    expect(screen.getByRole('group', { name: 'Dairy' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Eggs' })).toBeInTheDocument();
  });

  it('filters ingredients by search term', () => {
    renderInForm((formRef) => (
      <IngredientFilter
        type="Include"
        ingredients={ingredients}
        formRef={formRef}
      />
    ));
    open('Include Ingredients');

    fireEvent.change(screen.getByLabelText('Ingredient name'), {
      target: { value: 'egg' },
    });

    expect(screen.getByRole('checkbox', { name: 'Egg' })).toBeInTheDocument();
    expect(
      screen.queryByRole('checkbox', { name: 'Milk' }),
    ).not.toBeInTheDocument();
  });

  it('shows the no results text when nothing matches', () => {
    renderInForm((formRef) => (
      <IngredientFilter
        type="Include"
        ingredients={ingredients}
        formRef={formRef}
      />
    ));
    open('Include Ingredients');

    fireEvent.change(screen.getByLabelText('Ingredient name'), {
      target: { value: 'zzz' },
    });
    expect(screen.getByText('No ingredients found')).toBeInTheDocument();
  });

  it('selects an ingredient together with its descendants', () => {
    const { container } = renderInForm((formRef) => (
      <IngredientFilter
        type="Include"
        ingredients={ingredients}
        formRef={formRef}
      />
    ));
    open('Include Ingredients');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Milk' }));

    expect(hiddenInput(container, 'includeIngredients').value).toBe(
      'milk,skim',
    );
    expect(screen.getByRole('checkbox', { name: 'Skim milk' })).toBeChecked();
    expect(
      screen.getByRole('button', { name: 'Include Ingredients (2)' }),
    ).toBeInTheDocument();
  });

  it('unchecking a parent removes it and its descendants', () => {
    const { container } = renderInForm((formRef) => (
      <IngredientFilter
        type="Include"
        ingredients={ingredients}
        initialValue={['milk', 'skim']}
        formRef={formRef}
      />
    ));
    open('Include Ingredients (2)');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Milk' }));

    expect(hiddenInput(container, 'includeIngredients').value).toBe('');
  });

  it('unchecking a child also removes its ancestors', () => {
    const { container } = renderInForm((formRef) => (
      <IngredientFilter
        type="Include"
        ingredients={ingredients}
        initialValue={['egg', 'milk', 'skim']}
        formRef={formRef}
      />
    ));
    open('Include Ingredients (3)');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Skim milk' }));

    expect(hiddenInput(container, 'includeIngredients').value).toBe('egg');
  });

  it('reports whether the filter is active', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <IngredientFilter
        ingredients={ingredients}
        type="Exclude"
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));
    expect(update).toHaveBeenLastCalledWith('excludeIngredients', false);

    open('Exclude Ingredients');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Egg' }));
    expect(update).toHaveBeenLastCalledWith('excludeIngredients', true);
  });

  it('clears the selection when the form is reset', () => {
    const update = jest.fn();
    const { container } = renderInForm((formRef) => (
      <IngredientFilter
        type="Include"
        ingredients={ingredients}
        initialValue={['egg']}
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(hiddenInput(container, 'includeIngredients').value).toBe('');
    expect(update).toHaveBeenLastCalledWith('includeIngredients', false);
  });

  it('works without an updateActiveFilters callback', () => {
    const { container } = renderInForm((formRef) => (
      <IngredientFilter
        type="Include"
        ingredients={ingredients}
        formRef={formRef}
      />
    ));
    open('Include Ingredients');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Egg' }));
    expect(hiddenInput(container, 'includeIngredients').value).toBe('egg');
  });
});
