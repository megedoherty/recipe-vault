import { render, screen } from '@testing-library/react';

import Step from './Step';

const defaultProps = {
  step: {
    id: '1',
    text: 'Step 1',
    ingredientIds: undefined,
  },
  ingredients: {
    '1': {
      id: '1',
      name: 'Ingredient 1',
      quantity: '1',
      section: null,
      normalizedIngredientId: null,
      normalizedIngredientName: null,
      category: 'Category 1',
    },
    '2': {
      id: '2',
      name: 'Ingredient 2',
      quantity: '2',
      section: null,
      normalizedIngredientId: null,
      normalizedIngredientName: null,
      category: 'Category 2',
    },
  },
  updateActiveStep: jest.fn(),
  getStepStatus: jest.fn(),
};

describe('StepIngredients', () => {
  it('should render only the step if no ingredient ids are provided', () => {
    render(<Step {...defaultProps} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.queryByText('1 Ingredient 1')).not.toBeInTheDocument();
  });

  it('should render the ingredients used if ingredient ids are provided', () => {
    render(
      <Step
        {...defaultProps}
        step={{ ...defaultProps.step, ingredientIds: ['1', '2'] }}
      />,
    );
    expect(
      screen.getByText('1 Ingredient 1, 2 Ingredient 2'),
    ).toBeInTheDocument();
  });

  it('should render the ingredients even if no quantities', () => {
    render(
      <Step
        {...defaultProps}
        step={{ ...defaultProps.step, ingredientIds: ['1'] }}
        ingredients={{
          '1': { ...defaultProps.ingredients['1'], quantity: null },
        }}
      />,
    );
    expect(screen.getByText('Ingredient 1')).toBeInTheDocument();
  });
});
