import {
  IngredientCatalogEntryForRecipeEdit,
  IngredientCatalogEntryForRecipeEditDb,
} from '@/types';

import { createClient } from '../server';

const transformIngredientCatalog = (
  data: IngredientCatalogEntryForRecipeEditDb[],
): IngredientCatalogEntryForRecipeEdit[] => {
  return data.map((item) => ({
    id: item.id.toString(),
    name: item.name,
    category: item.category,
  }));
};

export async function getIngredientCatalogForRecipeEdit(): Promise<
  IngredientCatalogEntryForRecipeEdit[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ingredient_catalog')
    .select('id, name, category')
    .order('name', { ascending: true });
  const transformed = data ? transformIngredientCatalog(data) : [];

  const priorityCategories = [
    'Flours & Starches',
    'Sugars & Sweeteners',
    'Baking Essentials',
    'Chocolate & Baking Chips',
    'Extracts & Flavorings',
    'Dairy',
    'Eggs',
    'Fats & Oils',
  ];

  return transformed.sort((a, b) => {
    const aPriority = priorityCategories.indexOf(a.category || '');
    const bPriority = priorityCategories.indexOf(b.category || '');

    // If both are in priority list, sort by priority order
    if (aPriority !== -1 && bPriority !== -1) {
      return aPriority - bPriority;
    }
    // If only a is in priority, it comes first
    if (aPriority !== -1) return -1;
    // If only b is in priority, it comes first
    if (bPriority !== -1) return 1;
    // If neither is in priority, sort alphabetically
    return (a.category || '').localeCompare(b.category || '');
  });
}
