import { render, screen } from '@testing-library/react';

import Alert from './Alert';

describe('Alert', () => {
  it('should render its content as an alert', () => {
    render(<Alert>Something went wrong</Alert>);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('should render links inside it', () => {
    render(
      <Alert>
        Already there: <a href="https://example.com/cake">Cake</a>
      </Alert>,
    );

    expect(screen.getByRole('link', { name: 'Cake' })).toHaveAttribute(
      'href',
      'https://example.com/cake',
    );
  });

  it('should accept an extra class name', () => {
    render(<Alert className="extra">Oops</Alert>);

    expect(screen.getByRole('alert')).toHaveClass('extra');
  });
});
