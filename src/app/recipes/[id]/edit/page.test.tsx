import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';

import { parseRecipeFromUrl } from '@/lib/actions/recipeParser/recipeParser';
import { getCategories } from '@/lib/supabase/queries/categories';
import { getEquipment } from '@/lib/supabase/queries/equipment';
import { getIngredientsForRecipeEdit } from '@/lib/supabase/queries/ingredients';
import { getMealTypes } from '@/lib/supabase/queries/mealTypes';
import { getOccasions } from '@/lib/supabase/queries/occasions';
import {
  getRecipeForEdit,
  getRecipeIngredientsForEdit,
} from '@/lib/supabase/queries/recipes';
import { canModifyRecipe, getUser } from '@/lib/supabase/queries/user';
import { ParsedRecipe, SavedEditableRecipe } from '@/types';

import EditRecipePage, { generateMetadata } from './page';

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
// A factory avoids loading the real parser, which imports cheerio's ESM build
jest.mock('@/lib/actions/recipeParser/recipeParser', () => ({
  parseRecipeFromUrl: jest.fn(),
}));
jest.mock('@/lib/actions/recipes', () => ({
  addRecipe: jest.fn(),
  updateRecipe: jest.fn(),
}));
jest.mock('@/lib/supabase/queries/categories');
jest.mock('@/lib/supabase/queries/equipment');
jest.mock('@/lib/supabase/queries/ingredients');
jest.mock('@/lib/supabase/queries/mealTypes');
jest.mock('@/lib/supabase/queries/occasions');
jest.mock('@/lib/supabase/queries/recipes');
jest.mock('@/lib/supabase/queries/user');
jest.mock('next/form', () => ({
  __esModule: true,
  default: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <form className={className}>{children}</form>,
}));

const recipe: SavedEditableRecipe = {
  userId: 'owner',
  name: 'Banana Bread',
  imageUrl: 'https://img/saved.jpg',
  sourceUrl: 'https://example.com/banana',
  instructions: [
    { id: 's1', title: null, steps: [{ id: 'a', text: 'Old step' }] },
  ],
  categoryId: null,
  equipmentIds: [],
  servings: 8,
  storage: [],
  notes: 'My note',
  mealTypeId: null,
  occasionId: null,
};

const savedSections = [
  {
    id: 'sec1',
    title: null,
    ingredients: [
      {
        id: 'i1',
        name: 'saved flour',
        quantity: '2 cups',
        section: null,
        ingredientId: null,
      },
    ],
  },
];

const parsed: ParsedRecipe = {
  recipe: {
    ...recipe,
    name: 'Fresh Banana Bread',
    imageUrl: 'https://img/fresh.jpg',
    instructions: [
      { id: 's2', title: null, steps: [{ id: 'b', text: 'New step' }] },
    ],
    servings: 12,
  },
  ingredients: [
    {
      id: 'sec2',
      title: null,
      ingredients: [
        {
          id: 'i2',
          name: 'fresh flour',
          quantity: '3 cups',
          section: null,
          ingredientId: null,
        },
      ],
    },
  ],
  imageUrls: ['https://img/fresh.jpg'],
};

const renderPage = async (refresh?: string) =>
  render(
    await EditRecipePage({
      params: Promise.resolve({ id: 'r1' }),
      searchParams: Promise.resolve({ refresh }),
    } as never),
  );

const nameField = () => screen.getByRole('textbox', { name: 'Recipe Name' });

describe('EditRecipePage', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (getUser as jest.Mock).mockResolvedValue({ id: 'owner' });
    (canModifyRecipe as jest.Mock).mockReturnValue(true);
    (getRecipeForEdit as jest.Mock).mockResolvedValue(recipe);
    (getRecipeIngredientsForEdit as jest.Mock).mockResolvedValue(savedSections);
    (getCategories as jest.Mock).mockResolvedValue([]);
    (getIngredientsForRecipeEdit as jest.Mock).mockResolvedValue([]);
    (getEquipment as jest.Mock).mockResolvedValue([]);
    (getMealTypes as jest.Mock).mockResolvedValue([]);
    (getOccasions as jest.Mock).mockResolvedValue([]);
    (parseRecipeFromUrl as jest.Mock).mockResolvedValue(parsed);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('redirects signed-out users to log in', async () => {
    (getUser as jest.Mock).mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow('NEXT_REDIRECT:/auth/login');
  });

  it('shows a message when the recipe does not exist', async () => {
    (getRecipeForEdit as jest.Mock).mockResolvedValue(null);

    await renderPage();

    expect(screen.getByText('Recipe not found')).toBeInTheDocument();
  });

  it('sends users who cannot modify the recipe to the read-only view', async () => {
    (canModifyRecipe as jest.Mock).mockReturnValue(false);

    await expect(renderPage()).rejects.toThrow('NEXT_REDIRECT:/recipes/r1');
    expect(redirect).toHaveBeenCalledWith('/recipes/r1');
    expect(canModifyRecipe).toHaveBeenCalledWith({ id: 'owner' }, 'owner');
  });

  it('fills the form with the saved recipe', async () => {
    await renderPage();

    expect(
      screen.getByRole('heading', { name: 'Edit Recipe' }),
    ).toBeInTheDocument();
    expect(nameField()).toHaveValue('Banana Bread');
    expect(screen.getByRole('textbox', { name: 'Source URL' })).toHaveValue(
      'https://example.com/banana',
    );
    expect(screen.getByRole('spinbutton', { name: 'Servings' })).toHaveValue(8);
    expect(screen.getByDisplayValue('saved flour')).toBeInTheDocument();
    expect(parseRecipeFromUrl).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('link', { name: 'Cancel' }),
    ).not.toBeInTheDocument();
  });

  describe('refresh', () => {
    it('ignores the refresh param when the recipe has no source URL', async () => {
      (getRecipeForEdit as jest.Mock).mockResolvedValue({
        ...recipe,
        sourceUrl: null,
      });

      await renderPage('1');

      expect(parseRecipeFromUrl).not.toHaveBeenCalled();
      expect(nameField()).toHaveValue('Banana Bread');
    });

    it('re-imports from the source URL and fills the form with the merged result', async () => {
      (getCategories as jest.Mock).mockResolvedValue([
        { id: 1, name: 'Baking' },
      ]);

      await renderPage('1');

      expect(parseRecipeFromUrl).toHaveBeenCalledWith(
        'https://example.com/banana',
        [],
        [{ id: 1, name: 'Baking' }],
        [],
        [],
      );
      // Name, servings and ingredients come from the re-import...
      expect(nameField()).toHaveValue('Fresh Banana Bread');
      expect(screen.getByRole('spinbutton', { name: 'Servings' })).toHaveValue(
        12,
      );
      expect(screen.getByDisplayValue('fresh flour')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('saved flour')).not.toBeInTheDocument();
      // ...while saved data the parser can't know about is kept
      expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue(
        'My note',
      );
      // The saved and re-imported images are offered to choose from
      expect(screen.getAllByRole('img', { name: /Recipe Image/ })).toHaveLength(
        2,
      );
      expect(
        screen.getByText(/Nothing is saved until you click Save/),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
        'href',
        '/recipes/r1',
      );
    });

    it('shows an error and keeps the saved recipe when parsing fails', async () => {
      (parseRecipeFromUrl as jest.Mock).mockRejectedValue(new Error('boom'));

      await renderPage('1');

      expect(screen.getByText(/Couldn't refresh/)).toBeInTheDocument();
      expect(nameField()).toHaveValue('Banana Bread');
      expect(screen.getByDisplayValue('saved flour')).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'Cancel' }),
      ).not.toBeInTheDocument();
      expect(console.error).toHaveBeenCalled();
    });

    it.each([
      ['name', { ...parsed, recipe: { ...parsed.recipe, name: '' } }],
      ['ingredients', { ...parsed, ingredients: [] }],
      [
        'instructions',
        { ...parsed, recipe: { ...parsed.recipe, instructions: [] } },
      ],
    ])('treats a parse result with no %s as an error', async (_, result) => {
      (parseRecipeFromUrl as jest.Mock).mockResolvedValue(result);

      await renderPage('1');

      expect(screen.getByText(/Couldn't refresh/)).toBeInTheDocument();
      expect(nameField()).toHaveValue('Banana Bread');
    });
  });
});

describe('generateMetadata', () => {
  it('titles the page with the recipe name', async () => {
    (getRecipeForEdit as jest.Mock).mockResolvedValue(recipe);

    await expect(
      generateMetadata({ params: Promise.resolve({ id: 'r1' }) }),
    ).resolves.toEqual({ title: 'Edit Banana Bread | Recipe Vault' });
  });
});
