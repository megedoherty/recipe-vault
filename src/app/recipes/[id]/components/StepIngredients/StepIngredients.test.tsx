import { render, screen } from '@testing-library/react';

import StepIngredients from './StepIngredients';

const defaultProps = {
  ingredientIds: undefined,
  ingredients: {
    '1': {
      id: '1',
      name: 'Ingredient 1',
      quantity: '1',
      section: null,
    },
    '2': {
      id: '2',
      name: 'Ingredient 2',
      quantity: '2',
      section: null,
    },
  },
};

describe('StepIngredients', () => {
  it('should render nothing if no ingredient ids are provided', () => {
    const { container } = render(<StepIngredients {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render the ingredients used if ingredient ids are provided', () => {
    render(<StepIngredients {...defaultProps} ingredientIds={['1', '2']} />);
    expect(
      screen.getByText('1 Ingredient 1, 2 Ingredient 2'),
    ).toBeInTheDocument();
  });

  it('should render the ingredients even if no quantities', () => {
    render(
      <StepIngredients
        ingredientIds={['1']}
        ingredients={{
          '1': {
            id: '1',
            name: 'Ingredient 1',
            quantity: null,
          },
        }}
      />,
    );
    expect(screen.getByText('Ingredient 1')).toBeInTheDocument();
  });
});
