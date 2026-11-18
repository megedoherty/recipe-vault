import { fireEvent, render, screen } from '@testing-library/react';

import SearchForm from './SearchForm';

const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

const defaultProps = {
  categories: [
    { id: 1, name: 'Dinner' },
    { id: 2, name: 'Dessert' },
  ],
  ingredients: [],
  equipment: [],
  servingsRange: { min: 1, max: 12 },
  mealTypes: [
    { id: 10, name: 'Breakfast' },
    { id: 11, name: 'Lunch' },
  ],
  occasions: [{ id: 20, name: 'Birthday' }],
};

const nameInput = () =>
  screen.getByLabelText('Recipe name') as HTMLInputElement;
const searchButton = () => screen.getByRole('button', { name: /^Search/ });
const clearButton = () => screen.getByRole('button', { name: /^Clear/ });

describe('SearchForm', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
  });

  it('renders the search fields and buttons inside a search landmark', () => {
    const { container } = render(<SearchForm {...defaultProps} />);

    // jsdom doesn't map <search> to the "search" role, so check the element
    expect(container.querySelector('search form')).toBeInTheDocument();
    expect(nameInput()).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Select a meal type' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Select a category' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'More Filters' }),
    ).toBeInTheDocument();
    expect(searchButton()).toBeInTheDocument();
    expect(clearButton()).toBeInTheDocument();
  });

  it('populates fields from the URL search params', () => {
    mockSearchParams = new URLSearchParams(
      'name=pasta&categoryId=2&mealTypeId=11',
    );
    render(<SearchForm {...defaultProps} />);

    expect(nameInput()).toHaveValue('pasta');
    expect(
      screen.getByLabelText('Category', { selector: '#category' }),
    ).toHaveValue('2');
    expect(screen.getByLabelText('Meal type')).toHaveValue('11');
  });

  it('passes the active filters from the URL to the filters modal', () => {
    mockSearchParams = new URLSearchParams(
      'made=true&includeAllUsers=true&bookmarked=true&minServings=2&includeIngredients=a,b&equipment=e1&occasionId=20',
    );
    render(<SearchForm {...defaultProps} />);

    // made, includeAllUsers, bookmarked, minServings, includeIngredients, equipment, occasion
    expect(
      screen.getByRole('button', { name: 'More Filters (7)' }),
    ).toBeInTheDocument();
  });

  it('treats made=false as an active "no" filter', () => {
    mockSearchParams = new URLSearchParams('made=false');
    render(<SearchForm {...defaultProps} />);

    expect(
      screen.getByRole('button', { name: 'More Filters (1)' }),
    ).toBeInTheDocument();
  });

  it('updates the URL with the form values on submit', () => {
    render(<SearchForm {...defaultProps} />);

    fireEvent.change(nameInput(), { target: { value: '  pasta ' } });
    fireEvent.click(searchButton());

    expect(mockReplace).toHaveBeenCalledWith('/?name=pasta');
  });

  it('does not navigate when the query has not changed', () => {
    mockSearchParams = new URLSearchParams('name=pasta');
    render(<SearchForm {...defaultProps} />);

    fireEvent.click(searchButton());

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('navigates to "/" when submitting an emptied form with params set', () => {
    mockSearchParams = new URLSearchParams('name=pasta');
    render(<SearchForm {...defaultProps} />);

    fireEvent.change(nameInput(), { target: { value: '' } });
    fireEvent.click(searchButton());

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('navigates to "/" when Clear is clicked with params set', () => {
    mockSearchParams = new URLSearchParams('name=pasta');
    render(<SearchForm {...defaultProps} />);

    fireEvent.click(clearButton());

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('clears typed values without navigating when the URL has no params', () => {
    render(<SearchForm {...defaultProps} />);

    fireEvent.change(nameInput(), { target: { value: 'pasta' } });
    fireEvent.click(clearButton());

    expect(mockReplace).not.toHaveBeenCalled();
    expect(nameInput()).toHaveValue('');
  });

  it('does nothing on Clear when the form is already empty', () => {
    render(<SearchForm {...defaultProps} />);

    fireEvent.click(clearButton());

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
