import { render, screen } from '@testing-library/react';

import RecipeHeader from './RecipeHeader';

const defaultProps = {
  recipeId: '1',
  name: 'Recipe Name',
  sourceUrl: 'https://example.com',
  made: false,
  rating: 3,
};

describe('RecipeHeader', () => {
  it('should render the recipe header', () => {
    render(<RecipeHeader {...defaultProps} isLoggedIn={true} />);
    expect(screen.getByText(`${defaultProps.name} Recipe`)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: defaultProps.sourceUrl }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Edit recipe' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete recipe' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'I made this' }),
    ).toBeInTheDocument();
  });

  it('should hide the edit and delete buttons if not logged in', () => {
    render(<RecipeHeader {...defaultProps} isLoggedIn={false} />);
    expect(
      screen.queryByRole('link', { name: 'Edit recipe' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete recipe' }),
    ).not.toBeInTheDocument();
  });
});
