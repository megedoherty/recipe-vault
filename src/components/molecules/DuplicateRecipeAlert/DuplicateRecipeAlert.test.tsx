import { render, screen } from '@testing-library/react';

import DuplicateRecipeAlert from './DuplicateRecipeAlert';

describe('DuplicateRecipeAlert', () => {
  it('should link the recipe name to the existing recipe', () => {
    render(<DuplicateRecipeAlert recipe={{ id: 'r1', name: 'Cake' }} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'You already imported Cake.',
    );
    expect(screen.getByRole('link', { name: 'Cake' })).toHaveAttribute(
      'href',
      '/recipes/r1',
    );
  });

  it('should pass the id through for aria-describedby', () => {
    render(
      <DuplicateRecipeAlert recipe={{ id: 'r1', name: 'Cake' }} id="dup" />,
    );

    expect(screen.getByRole('alert')).toHaveAttribute('id', 'dup');
  });
});
