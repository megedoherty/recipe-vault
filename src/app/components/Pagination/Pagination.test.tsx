import { fireEvent, render, screen } from '@testing-library/react';

import Pagination from './Pagination';

const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

describe('Pagination', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
  });

  it('shows only Next on the first page', () => {
    render(<Pagination currentPage={1} totalPages={3} />);

    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous' }),
    ).not.toBeInTheDocument();
  });

  it('shows only Previous on the last page', () => {
    render(<Pagination currentPage={3} totalPages={3} />);

    expect(
      screen.getByRole('button', { name: 'Previous' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next' }),
    ).not.toBeInTheDocument();
  });

  it('shows both buttons on a middle page', () => {
    render(<Pagination currentPage={2} totalPages={3} />);

    expect(
      screen.getByRole('button', { name: 'Previous' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('shows no buttons when there is a single page', () => {
    render(<Pagination currentPage={1} totalPages={1} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('goes to the next page', () => {
    render(<Pagination currentPage={1} totalPages={3} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(mockReplace).toHaveBeenCalledWith('/?page=2');
  });

  it('keeps existing search params when changing page', () => {
    mockSearchParams = new URLSearchParams('name=pasta&sort=newest');
    render(<Pagination currentPage={1} totalPages={3} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(mockReplace).toHaveBeenCalledWith('/?name=pasta&sort=newest&page=2');
  });

  it('removes the page param when going back to page 1', () => {
    mockSearchParams = new URLSearchParams('name=pasta&page=2');
    render(<Pagination currentPage={2} totalPages={3} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));

    expect(mockReplace).toHaveBeenCalledWith('/?name=pasta');
  });

  it('navigates to "/" when going to page 1 leaves no params', () => {
    mockSearchParams = new URLSearchParams('page=2');
    render(<Pagination currentPage={2} totalPages={3} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));

    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
