import { render, screen } from '@testing-library/react';

import Hint from './Hint';

describe('Hint', () => {
  it('should render its children', () => {
    render(<Hint>Helpful text</Hint>);
    expect(screen.getByText('Helpful text')).toBeInTheDocument();
  });

  it('should render as a small element', () => {
    render(<Hint>Helpful text</Hint>);
    expect(screen.getByText('Helpful text').tagName).toBe('SMALL');
  });
});
