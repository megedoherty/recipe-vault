import { EditableRecipe, ParsedRecipe } from '@/types';

import { mergeRefreshedRecipe } from './refresh';

const existing: EditableRecipe = {
  name: 'Old name',
  imageUrl: 'https://x.supabase.co/old.jpg',
  sourceUrl: 'https://example.com/recipe',
  instructions: [],
  categoryId: 1,
  equipmentIds: ['3'],
  servings: 4,
  storage: [],
  notes: null,
  mealTypeId: null,
  occasionId: 7,
};

const parsed: ParsedRecipe = {
  recipe: {
    ...existing,
    name: 'New name',
    imageUrl: 'https://example.com/new.jpg',
    equipmentIds: [],
    categoryId: 2,
    servings: 6,
    notes: 'Fresh note',
    mealTypeId: 5,
    occasionId: null,
  },
  ingredients: [],
  imageUrls: ['https://example.com/new.jpg', 'https://x.supabase.co/old.jpg'],
};

describe('mergeRefreshedRecipe', () => {
  it('takes name and servings from the re-import', () => {
    const { recipe } = mergeRefreshedRecipe(existing, parsed);
    expect(recipe.name).toBe('New name');
    expect(recipe.servings).toBe(6);
  });

  it('keeps user-set fields', () => {
    const { recipe } = mergeRefreshedRecipe(existing, parsed);
    expect(recipe.equipmentIds).toEqual(['3']);
    expect(recipe.occasionId).toBe(7);
    expect(recipe.categoryId).toBe(1);
    expect(recipe.sourceUrl).toBe(existing.sourceUrl);
  });

  it('fills empty notes and meal type from the re-import', () => {
    const { recipe } = mergeRefreshedRecipe(existing, parsed);
    expect(recipe.notes).toBe('Fresh note');
    expect(recipe.mealTypeId).toBe(5);
  });

  it('lists the current image first without duplicates', () => {
    const { imageOptions, recipe } = mergeRefreshedRecipe(existing, parsed);
    expect(imageOptions).toEqual([
      'https://x.supabase.co/old.jpg',
      'https://example.com/new.jpg',
    ]);
    expect(recipe.imageUrl).toBe(existing.imageUrl);
  });
});
