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

/**
 * When editing or creating a recipe, only return the ingredients that are not children of other ingredients.
 * This is to avoid showing ingredients like "Sugar" and "Granulated Sugar" as separate options.
 */
export async function getIngredientCatalogForRecipeEdit(): Promise<
  IngredientCatalogEntryForRecipeEdit[]
> {
  const supabase = await createClient();
  const { data: allIngredients } = await supabase
    .from('ingredient_catalog')
    .select('id, name, category, parent_id');

  if (!allIngredients) {
    return [];
  }

  // Get all parent_ids that exist (these are ingredients that have children)
  const parentIds = new Set(
    allIngredients
      .map((ing) => ing.parent_id)
      .filter((id): id is number => id !== null),
  );

  // Filter to only ingredients that are not parents (i.e., have no children)
  const ingredientsWithNoChildren = allIngredients.filter(
    (ing) => !parentIds.has(ing.id),
  );

  // Sort by name
  ingredientsWithNoChildren.sort((a, b) => a.name.localeCompare(b.name));
  const transformed = transformIngredientCatalog(ingredientsWithNoChildren);

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
