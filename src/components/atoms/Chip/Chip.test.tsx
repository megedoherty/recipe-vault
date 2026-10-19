import { fireEvent, render, screen } from '@testing-library/react';

import Chip from './Chip';

describe('Chip', () => {
  it('should render its children in a button', () => {
    render(<Chip onClick={jest.fn()}>Dessert</Chip>);
    expect(screen.getByRole('button', { name: 'Dessert' })).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Chip onClick={onClick}>Dessert</Chip>);

    fireEvent.click(screen.getByRole('button', { name: 'Dessert' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
