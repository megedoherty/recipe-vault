import { render, screen } from '@testing-library/react';

import RecipeHeader from './RecipeHeader';

jest.mock('@/lib/actions/shoppingList', () => ({
  addToShoppingList: jest.fn(),
}));

jest.mock('@/lib/actions/recipes', () => ({
  toggleRecipeBookmarked: jest.fn(),
  deleteRecipe: jest.fn(),
}));

const defaultProps = {
  recipeId: '1',
  name: 'Recipe Name',
  sourceUrl: 'https://example.com',
  made: false,
  rating: 3,
  ingredients: [],
  canEdit: true,
  canBookmark: true,
  bookmarked: false,
};

describe('RecipeHeader', () => {
  it('should render the recipe header', () => {
    render(<RecipeHeader {...defaultProps} isLoggedIn={true} />);
    expect(screen.getByText(defaultProps.name)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: defaultProps.sourceUrl }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Edit recipe' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete recipe' }),
    ).toBeInTheDocument();
  });

  it('should hide the edit, refresh and delete buttons if the user cannot edit', () => {
    render(
      <RecipeHeader {...defaultProps} isLoggedIn={true} canEdit={false} />,
    );
    expect(
      screen.queryByRole('link', { name: 'Edit recipe' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Refresh recipe from source' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete recipe' }),
    ).not.toBeInTheDocument();
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

  it('should show the bookmark button to the owner', () => {
    render(<RecipeHeader {...defaultProps} isLoggedIn={true} />);
    expect(
      screen.getByRole('button', { name: 'Bookmark recipe' }),
    ).toBeInTheDocument();
  });

  it('should hide the bookmark button if the user cannot bookmark, even if they can edit', () => {
    render(
      <RecipeHeader {...defaultProps} isLoggedIn={true} canBookmark={false} />,
    );
    expect(
      screen.queryByRole('button', { name: /bookmark/i }),
    ).not.toBeInTheDocument();
  });
});
