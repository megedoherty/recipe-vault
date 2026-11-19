import { render, screen } from '@testing-library/react';
import { ComponentProps } from 'react';

import { ServingsProvider } from '../ServingsContext/ServingsContext';
import RecipeImageAndInfo from './RecipeImageAndInfo';

jest.mock('@/lib/actions/recipes', () => ({
  toggleRecipeMade: jest.fn(),
  updateRecipeRating: jest.fn(),
}));
jest.mock('@/components/molecules/Toast/ToastProvider', () => ({
  useToast: () => ({ showToast: jest.fn(), dismissToast: jest.fn() }),
}));

const SUPABASE_URL = 'https://abc.supabase.co';
const IMAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/recipe-images/pic.jpg`;

type Props = ComponentProps<typeof RecipeImageAndInfo>;

const baseProps: Props = {
  category: null,
  imageUrl: null,
  servings: null,
  occasion: null,
  storage: [],
  name: 'Banana Bread',
  equipment: [],
  mealType: null,
  recipeId: '1',
  made: false,
  rating: null,
  canEdit: true,
};

const renderInfo = (props: Partial<Props> = {}, base: number | null = null) =>
  render(
    <ServingsProvider baseServings={base}>
      <RecipeImageAndInfo {...baseProps} {...props} />
    </ServingsProvider>,
  );

describe('RecipeImageAndInfo', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  });

  it('renders the image when it is hosted in our bucket', () => {
    renderInfo({ imageUrl: IMAGE_URL });

    expect(
      screen.getByRole('img', { name: 'Banana Bread' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['missing', null],
    [
      'from another host',
      'https://example.com/storage/v1/object/public/recipe-images/pic.jpg',
    ],
  ])('skips the image when it is %s', (_, imageUrl) => {
    renderInfo({ imageUrl });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('hides optional details that are empty', () => {
    renderInfo();

    for (const label of [
      'Meal Type:',
      'Category:',
      'Occasion:',
      'Equipment:',
      'Storage:',
    ]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it('shows meal type, category, occasion, equipment and storage', () => {
    renderInfo({
      mealType: 'Dessert',
      category: 'Baking',
      occasion: 'Birthday',
      equipment: ['Whisk', 'Oven'],
      storage: [
        { location: 'Fridge', days: 3 },
        { location: 'Room Temperature', days: 2 },
      ],
    });

    expect(screen.getByText('Dessert')).toBeInTheDocument();
    expect(screen.getByText('Baking')).toBeInTheDocument();
    expect(screen.getByText('Birthday')).toBeInTheDocument();
    expect(screen.getByText('Whisk')).toBeInTheDocument();
    expect(screen.getByText('Oven')).toBeInTheDocument();
    expect(screen.getByText('Fridge - 3 days')).toBeInTheDocument();
    expect(screen.getByText('Room Temperature - 2 days')).toBeInTheDocument();
  });

  it('shows the servings scaler only when servings is positive', () => {
    const { unmount } = renderInfo({ servings: 4 }, 4);
    expect(screen.getByRole('group', { name: 'Servings' })).toBeInTheDocument();
    unmount();

    renderInfo({ servings: 0 }, 0);
    expect(
      screen.queryByRole('group', { name: 'Servings' }),
    ).not.toBeInTheDocument();
  });

  it('makes the made checkbox read-only when the user cannot edit', () => {
    renderInfo({ canEdit: false });

    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('lets the owner toggle the made checkbox', () => {
    renderInfo({ canEdit: true });

    expect(screen.getByRole('checkbox')).toBeEnabled();
  });
});
