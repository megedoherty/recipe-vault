import { render, screen } from '@testing-library/react';

import LoadingSpinner from './LoadingSpinner';

const SIZES = ['small', 'medium', 'large'];

const getSizeClasses = (spinner: Element) =>
  SIZES.filter((size) => spinner.classList.contains(size));

describe('LoadingSpinner', () => {
  it('should expose a status role with a default accessible label', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('should use a custom label when provided', () => {
    render(<LoadingSpinner label="Loading recipes" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading recipes');
  });

  it('should visually hide the label text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading')).toHaveClass('sr-only');
  });

  it('should hide the decorative spinner from assistive technology', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('[aria-hidden="true"]')).toHaveClass(
      'spinner',
    );
  });

  it('should default to the medium size', () => {
    const { container } = render(<LoadingSpinner />);
    expect(getSizeClasses(container.querySelector('.spinner')!)).toEqual([
      'medium',
    ]);
  });

  it.each(SIZES)('should apply only the %s size class', (size) => {
    const { container } = render(<LoadingSpinner size={size as 'small'} />);
    expect(getSizeClasses(container.querySelector('.spinner')!)).toEqual([
      size,
    ]);
  });

  it('should not be centered by default', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).not.toHaveClass('centered');
  });

  it('should be centered when isCentered is true', () => {
    render(<LoadingSpinner isCentered />);
    expect(screen.getByRole('status')).toHaveClass('centered');
  });
});
