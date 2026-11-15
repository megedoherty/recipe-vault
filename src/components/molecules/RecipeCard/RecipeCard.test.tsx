import { render, screen } from '@testing-library/react';

import RecipeCard from './RecipeCard';

const recipe = {
  id: '1',
  name: 'Soup',
  imageUrl: null,
  rating: null,
  made: false,
  bookmarked: false,
};

describe('RecipeCard', () => {
  it('should show the bookmarked indicator for bookmarked recipes', () => {
    render(<RecipeCard recipe={{ ...recipe, bookmarked: true }} />);
    expect(screen.getByRole('img', { name: 'Bookmarked' })).toBeInTheDocument();
  });

  it('should not show the indicator otherwise', () => {
    render(<RecipeCard recipe={recipe} />);
    expect(
      screen.queryByRole('img', { name: 'Bookmarked' }),
    ).not.toBeInTheDocument();
  });

  it('should not render the indicator as a control', () => {
    render(<RecipeCard recipe={{ ...recipe, bookmarked: true }} />);
    expect(
      screen.queryByRole('button', { name: /bookmark/i }),
    ).not.toBeInTheDocument();
  });
});
