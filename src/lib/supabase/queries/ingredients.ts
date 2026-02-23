import { sortByIngredientCategory } from '@/lib/utils/sort';
import {
  IngredientDb,
  IngredientForRecipeEdit,
  IngredientForSearch,
} from '@/types';

import { createClient } from '../server';

/**
 * When editing or creating a recipe, only return the ingredients that are not children of other ingredients.
 * This is to avoid showing ingredients like "Sugar" and "Granulated Sugar" as separate options.
 */
export async function getIngredientsForRecipeEdit(): Promise<
  IngredientForRecipeEdit[]
> {
  const supabase = await createClient();
  const { data: allIngredients } = await supabase
    .from('ingredient')
    .select('id, name, category, parent_id');

  if (!allIngredients) {
    console.error('No ingredients found');
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

  return sortByIngredientCategory(
    ingredientsWithNoChildren.map((ing) => ({
      id: ing.id.toString(),
      name: ing.name,
      category: ing.category,
    })),
  );
}

function getAllDescendants(
  parentId: string,
  parentToChildren: Record<string, string[]>,
  memo: Record<string, string[]> = {},
): string[] {
  // Return cached result if available
  if (parentId in memo) {
    return memo[parentId];
  }

  const directChildren = parentToChildren[parentId] || [];
  const allDescendants = new Set<string>(directChildren);

  // Recursively get descendants of each child
  for (const childId of directChildren) {
    const childDescendants = getAllDescendants(childId, parentToChildren, memo);
    childDescendants.forEach((desc) => allDescendants.add(desc));
  }

  const result = Array.from(allDescendants);
  memo[parentId] = result;
  return result;
}

function buildWithDepth(
  items: IngredientDb[],
  allItems: IngredientDb[],
  parentToDescendants: Record<string, string[]>,
  depth: number = 0,
  parentIds: string[] = [],
): IngredientForSearch[] {
  // Build items at this depth
  const itemsAtDepth: IngredientForSearch[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    childrenIds: parentToDescendants[item.id] || [],
    parentIds,
    depth,
  }));

  // Sort items at this depth
  const sorted = sortByIngredientCategory(itemsAtDepth);
  const result: IngredientForSearch[] = [];

  for (const item of sorted) {
    result.push(item);
    // Get direct children (not all descendants)
    const directChildren = allItems.filter(
      (child) => child.parentId === item.id,
    );

    if (directChildren.length > 0) {
      // Recursively add children with incremented depth and updated parentIds
      result.push(
        ...buildWithDepth(
          directChildren,
          allItems,
          parentToDescendants,
          depth + 1,
          [...parentIds, item.id],
        ),
      );
    }
  }

  return result;
}

/**
 * When searching for recipes, return all ingredients. Parents and children are included.
 */
export async function getIngredientsForSearch(): Promise<
  IngredientForSearch[]
> {
  const supabase = await createClient();
  const { data: allIngredients } = await supabase
    .from('ingredient')
    .select('id, name, category, parent_id');

  if (!allIngredients) {
    console.error('No ingredients found');
    return [];
  }

  // Convert to FE type so we have strings to work with
  const transformed = allIngredients.map((ing) => ({
    id: ing.id.toString(),
    name: ing.name,
    category: ing.category,
    parentId: ing.parent_id?.toString() ?? '',
  }));

  // Group by parent_id and get initial children map
  const grouped = Object.groupBy(transformed, (item) => item.parentId);
  const parentToChildren: Record<string, string[]> = {};

  for (const [parentId, children] of Object.entries(grouped)) {
    if (parentId === '') {
      continue;
    }
    parentToChildren[parentId] = children?.map((child) => child.id) ?? [];
  }

  const parentToDescendants: Record<string, string[]> = {};
  const memo: Record<string, string[]> = {};

  for (const parentId of Object.keys(parentToChildren)) {
    parentToDescendants[parentId] = getAllDescendants(
      parentId,
      parentToChildren,
      memo,
    );
  }

  // Start with root items (no parent)
  const rootItems = transformed.filter((item) => !item.parentId);

  return buildWithDepth(rootItems, transformed, parentToDescendants, 0);
}
