import { fireEvent, render, screen } from '@testing-library/react';

import SortBar from './SortBar';

const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

describe('SortBar', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
  });

  it('shows the range for a full page', () => {
    render(<SortBar count={50} page={1} />);
    expect(screen.getByText('1 - 24 of 50 recipes')).toBeInTheDocument();
  });

  it('shows the range for a later, partial page', () => {
    render(<SortBar count={50} page={3} />);
    expect(screen.getByText('49 - 50 of 50 recipes')).toBeInTheDocument();
  });

  it('shows a single number when the range is one recipe', () => {
    render(<SortBar count={49} page={3} />);
    expect(screen.getByText('49 of 49 recipes')).toBeInTheDocument();
  });

  it('defaults the sort select to the first option', () => {
    render(<SortBar count={5} page={1} />);
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveValue(
      'last_updated',
    );
  });

  it('reflects the sort search param', () => {
    mockSearchParams = new URLSearchParams('sort=oldest');
    render(<SortBar count={5} page={1} />);
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveValue(
      'oldest',
    );
  });

  it('sets the sort param and resets the page on change', () => {
    mockSearchParams = new URLSearchParams('name=pasta&page=2');
    render(<SortBar count={50} page={2} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort by' }), {
      target: { value: 'name_asc' },
    });
    expect(mockReplace).toHaveBeenCalledWith('/?name=pasta&sort=name_asc');
  });

  it('removes the sort param when switching back to the default', () => {
    mockSearchParams = new URLSearchParams('sort=newest');
    render(<SortBar count={5} page={1} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort by' }), {
      target: { value: 'last_updated' },
    });
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
