import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { parseRecipeFromUrl } from '@/lib/actions/recipeParser/recipeParser';
import { checkDuplicateRecipe } from '@/lib/actions/recipes';

import AddRecipeChoice from './AddRecipeChoice';

jest.mock('@/lib/actions/recipeParser/recipeParser', () => ({
  parseRecipeFromUrl: jest.fn(),
}));

jest.mock('@/lib/actions/recipes', () => ({
  checkDuplicateRecipe: jest.fn(),
}));

jest.mock('@/components/organisms/RecipeForm/RecipeForm', () => ({
  __esModule: true,
  default: () => <div>Recipe form</div>,
}));

const props = {
  categories: [],
  ingredients: [],
  equipment: [],
  mealTypes: [],
  occasions: [],
};

const choiceHeading = 'How would you like to add a recipe?';

describe('AddRecipeChoice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should show the choices initially', () => {
    render(<AddRecipeChoice {...props} />);

    expect(screen.getByText(choiceHeading)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  it('should go back from the URL screen', () => {
    render(<AddRecipeChoice {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add from URL' }));
    expect(screen.getByText('Add Recipe from URL')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText(choiceHeading)).toBeInTheDocument();
  });

  it('should go back from the manual form', () => {
    render(<AddRecipeChoice {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Manually' }));
    expect(screen.getByText('Recipe form')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText(choiceHeading)).toBeInTheDocument();
  });

  it('should go back from a parsed recipe and clear it', async () => {
    (parseRecipeFromUrl as jest.Mock).mockResolvedValue({
      recipe: { name: 'Cake', instructions: [{ id: '1' }] },
      ingredients: [{ id: '1' }],
      imageUrls: null,
    });

    render(<AddRecipeChoice {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add from URL' }));
    fireEvent.change(screen.getByLabelText('Recipe URL'), {
      target: { value: 'https://example.com/cake' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Fetch Recipe' }));

    await waitFor(() =>
      expect(screen.getByText('Review Recipe')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText(choiceHeading)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add Manually' }));
    expect(screen.getByText('Manual Form')).toBeInTheDocument();
  });

  it('should go back from the parse error screen', async () => {
    // The component deliberately logs when parsing fails; silence it here only
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'group').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'groupEnd').mockImplementation(() => {});

    (parseRecipeFromUrl as jest.Mock).mockResolvedValue({
      recipe: { name: '', instructions: [] },
      ingredients: [],
      imageUrls: null,
    });

    render(<AddRecipeChoice {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add from URL' }));
    fireEvent.change(screen.getByLabelText('Recipe URL'), {
      target: { value: 'https://example.com/bad' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Fetch Recipe' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(errorSpy).toHaveBeenCalledWith(
      'Missing recipe name, ingredients, or instructions',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText(choiceHeading)).toBeInTheDocument();
  });

  describe('duplicate URLs', () => {
    const fetchRecipe = (url: string) => {
      render(<AddRecipeChoice {...props} />);
      fireEvent.click(screen.getByRole('button', { name: 'Add from URL' }));
      fireEvent.change(screen.getByLabelText('Recipe URL'), {
        target: { value: url },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Fetch Recipe' }));
    };

    it('should link to the existing recipe without parsing', async () => {
      (checkDuplicateRecipe as jest.Mock).mockResolvedValue({
        id: 'r1',
        name: 'Cake',
      });

      fetchRecipe('https://example.com/cake');

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'You already imported Cake.',
      );
      expect(screen.getByRole('link', { name: 'Cake' })).toHaveAttribute(
        'href',
        '/recipes/r1',
      );
      expect(parseRecipeFromUrl).not.toHaveBeenCalled();
    });

    it('should flag the input and disable fetching until the URL changes', async () => {
      (checkDuplicateRecipe as jest.Mock).mockResolvedValue({
        id: 'r1',
        name: 'Cake',
      });

      fetchRecipe('https://example.com/cake');

      const alert = await screen.findByRole('alert');
      const input = screen.getByLabelText('Recipe URL');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', alert.id);
      expect(
        screen.getByRole('button', { name: 'Fetch Recipe' }),
      ).toBeDisabled();

      fireEvent.change(input, { target: { value: 'https://example.com/pie' } });

      expect(screen.queryByRole('alert')).toBeNull();
      expect(input).not.toHaveAttribute('aria-invalid');
      expect(
        screen.getByRole('button', { name: 'Fetch Recipe' }),
      ).toBeEnabled();
    });

    it('should check the canonical URL found by the parser', async () => {
      (checkDuplicateRecipe as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'r2', name: 'Cake' });
      (parseRecipeFromUrl as jest.Mock).mockResolvedValue({
        recipe: {
          name: 'Cake',
          sourceUrl: 'https://example.com/canonical-cake',
          instructions: [{ id: '1' }],
        },
        ingredients: [{ id: '1' }],
        imageUrls: null,
      });

      fetchRecipe('https://example.com/cake?x=1');

      expect(await screen.findByRole('link', { name: 'Cake' })).toHaveAttribute(
        'href',
        '/recipes/r2',
      );
      expect(checkDuplicateRecipe).toHaveBeenLastCalledWith(
        'https://example.com/canonical-cake',
      );
      expect(screen.queryByText('Review Recipe')).toBeNull();
    });

    it('should show an error when fetching fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (checkDuplicateRecipe as jest.Mock).mockResolvedValue(null);
      (parseRecipeFromUrl as jest.Mock).mockRejectedValue(new Error('boom'));

      fetchRecipe('https://example.com/cake');

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Could not fetch that recipe',
      );
    });
  });
});
