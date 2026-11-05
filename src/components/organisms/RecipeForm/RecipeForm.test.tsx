import { fireEvent, render, screen } from '@testing-library/react';

import { InstructionSection, RecipeIngredientSectionsEditable } from '@/types';

import RecipeForm from './RecipeForm';

jest.mock('@/lib/actions/recipes', () => ({
  addRecipe: jest.fn(),
  updateRecipe: jest.fn(),
}));

jest.mock('next/form', () => ({
  __esModule: true,
  default: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <form className={className}>{children}</form>,
}));

const props = {
  categories: [],
  ingredients: [],
  equipment: [],
  mealTypes: [],
  occasions: [],
};

const ingredientSections: RecipeIngredientSectionsEditable[] = [
  {
    id: 's1',
    title: null,
    ingredients: [
      {
        id: 'i1',
        name: 'all-purpose flour',
        quantity: '2 cups',
        section: null,
        ingredientId: null,
      },
    ],
  },
  {
    id: 's2',
    title: 'Frosting',
    ingredients: [
      {
        id: 'i2',
        name: 'butter',
        quantity: '1/2 cup',
        section: 'Frosting',
        ingredientId: null,
      },
    ],
  },
];

const instructionSections: InstructionSection[] = [
  { id: 'a', title: null, steps: [{ id: 'st1', text: 'Mix.' }] },
  { id: 'b', title: 'Bake', steps: [{ id: 'st2', text: 'Bake at 350°F.' }] },
];

const initialRecipe = {
  name: 'Cake',
  imageUrl: null,
  sourceUrl: null,
  instructions: instructionSections,
  categoryId: null,
  equipmentIds: [],
  servings: null,
  storage: [],
  notes: null,
  mealTypeId: null,
  occasionId: null,
};

describe('RecipeForm text editing', () => {
  it('should show raw text entry for ingredients and instructions when creating from scratch', () => {
    render(<RecipeForm {...props} mode="create" />);

    expect(screen.getByLabelText('All Ingredients')).toBeInTheDocument();
    expect(screen.getByLabelText('All Instructions')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit as Text' }),
    ).not.toBeInTheDocument();
  });

  it('should open parsed data in the row editors with an Edit as Text button for each section', () => {
    render(
      <RecipeForm
        {...props}
        mode="create"
        initialRecipe={initialRecipe}
        initialIngredientSections={ingredientSections}
      />,
    );

    expect(screen.queryByLabelText('All Ingredients')).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Edit as Text' }),
    ).toHaveLength(2);
  });

  it('should turn parsed ingredients into text', () => {
    render(
      <RecipeForm
        {...props}
        mode="create"
        initialRecipe={initialRecipe}
        initialIngredientSections={ingredientSections}
      />,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit as Text' })[0]);

    expect(screen.getByLabelText('All Ingredients')).toHaveValue(
      '2 cups all-purpose flour\nFrosting:\n1/2 cup butter',
    );
  });

  it('should turn parsed instructions into text', () => {
    render(
      <RecipeForm
        {...props}
        mode="create"
        initialRecipe={initialRecipe}
        initialIngredientSections={ingredientSections}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit as Text' })[1]);
    expect(screen.getByLabelText('All Instructions')).toHaveValue(
      'Mix.\nBake:\nBake at 350°F.',
    );
  });

  it('should re-parse edited ingredient text back into rows', () => {
    render(
      <RecipeForm
        {...props}
        mode="create"
        initialRecipe={initialRecipe}
        initialIngredientSections={ingredientSections}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit as Text' })[0]);
    fireEvent.change(screen.getByLabelText('All Ingredients'), {
      target: { value: '3 cups sugar' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Process Ingredients' }),
    );

    expect(screen.queryByLabelText('All Ingredients')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit as Text' })[0]);
    expect(screen.getByLabelText('All Ingredients')).toHaveValue(
      '3 cups sugar',
    );
  });

  it('should not offer Edit as Text when updating a recipe', () => {
    render(
      <RecipeForm
        {...props}
        mode="update"
        recipeId="r1"
        initialRecipe={initialRecipe}
        initialIngredientSections={ingredientSections}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Edit as Text' }),
    ).not.toBeInTheDocument();
  });
});

describe('RecipeForm ingredient links', () => {
  const linkedRecipe = {
    ...initialRecipe,
    instructions: [
      {
        id: 'a',
        title: null,
        steps: [{ id: 'st1', text: 'Mix.', ingredientIds: ['i1', 'i2'] }],
      },
    ],
  };

  const renderUpdate = () =>
    render(
      <RecipeForm
        {...props}
        mode="update"
        recipeId="r1"
        initialRecipe={linkedRecipe}
        initialIngredientSections={ingredientSections}
      />,
    );

  // A link to an ingredient that no longer exists renders as a chip with no
  // label, so a stale link shows up as a button with no accessible name.
  const emptyChips = () => screen.queryAllByRole('button', { name: '' });

  it('should show the ingredients linked to a step', () => {
    renderUpdate();

    expect(screen.getByText('2 cups all-purpose flour')).toBeInTheDocument();
    expect(screen.getByText('1/2 cup butter')).toBeInTheDocument();
    expect(emptyChips()).toHaveLength(0);
  });

  it('should unlink an ingredient from its steps when the ingredient is deleted', () => {
    renderUpdate();

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Delete ingredient' })[0],
    );

    expect(
      screen.queryByText('2 cups all-purpose flour'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('1/2 cup butter')).toBeInTheDocument();
    expect(emptyChips()).toHaveLength(0);
  });

  it('should unlink every ingredient in a section when the section is deleted', () => {
    renderUpdate();

    fireEvent.click(
      screen.getAllByRole('button', { name: /delete section/i })[1],
    );

    expect(screen.queryByText('1/2 cup butter')).not.toBeInTheDocument();
    expect(screen.getByText('2 cups all-purpose flour')).toBeInTheDocument();
    expect(emptyChips()).toHaveLength(0);
  });
});
