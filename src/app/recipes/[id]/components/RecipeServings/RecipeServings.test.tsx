import { fireEvent, render, screen } from '@testing-library/react';

import {
  ServingsProvider,
  useServings,
} from '../ServingsContext/ServingsContext';
import RecipeServings from './RecipeServings';

function Current() {
  return <p data-testid="current">{useServings().servings}</p>;
}

describe('RecipeServings', () => {
  it('renders nothing when the recipe has no servings to scale from', () => {
    const { container } = render(
      <ServingsProvider baseServings={null}>
        <RecipeServings />
      </ServingsProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the scaler and updates the shared servings', () => {
    render(
      <ServingsProvider baseServings={4}>
        <RecipeServings />
        <Current />
      </ServingsProvider>,
    );

    expect(screen.getByTestId('current')).toHaveTextContent('4');

    fireEvent.click(screen.getByRole('button', { name: 'Increase servings' }));

    expect(screen.getByTestId('current')).toHaveTextContent('5');
  });
});
