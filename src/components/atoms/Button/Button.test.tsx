import { render, screen } from '@testing-library/react';

import Button from './Button';

describe('Button', () => {
  it('should render the button', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: 'Click me' }),
    ).toBeInTheDocument();
  });

  it('should render the button as a link if href is provided', () => {
    render(<Button href="https://example.com">Click me</Button>);
    expect(screen.getByRole('link', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should apply small size class when size is small', () => {
    render(<Button size="small">Small button</Button>);
    const button = screen.getByRole('button', { name: 'Small button' });
    expect(button?.className).toContain('small');
  });
});
