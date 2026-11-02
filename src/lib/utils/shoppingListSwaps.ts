import { resolveCombinedQuantity } from '@/lib/utils/shoppingList';
import { sortByIngredientCategory } from '@/lib/utils/sort';
import { IngredientForRecipeEdit, RecipeIngredientDisplay } from '@/types';

/** One row in the add-to-shopping-list modal: lines sharing a normalized ingredient. */
export interface CombinedIngredients {
  ingredientId: string;
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  sourceIngredients: RecipeIngredientDisplay[];
}

/** The replacement ingredient chosen for each recipe ingredient line id. */
export type IngredientSwaps = Record<string, IngredientForRecipeEdit>;

/**
 * Replaces swapped lines' ingredient with its replacement, leaving quantities
 * unchanged. The original name is kept in the line text for the by-recipe view.
 */
export function applySwaps(
  ingredients: RecipeIngredientDisplay[],
  swaps: IngredientSwaps,
): RecipeIngredientDisplay[] {
  return ingredients.map((ingredient) => {
    const swap = swaps[ingredient.id];
    if (!swap) return ingredient;
    return {
      ...ingredient,
      name: `${swap.name} (instead of ${ingredient.name})`,
      normalizedIngredientId: Number(swap.id),
      normalizedIngredientName: swap.name,
      category: swap.category,
    };
  });
}

/**
 * Returns swaps with `option` applied to every given line. With no option, or
 * when it is a line's own original ingredient, that line's swap is removed.
 */
export function updateSwaps(
  swaps: IngredientSwaps,
  sourceIds: string[],
  option: IngredientForRecipeEdit | undefined,
  originalsById: Map<string, RecipeIngredientDisplay>,
): IngredientSwaps {
  const next = { ...swaps };
  for (const sourceId of sourceIds) {
    const original = originalsById.get(sourceId);
    if (!option || original?.normalizedIngredientId?.toString() === option.id) {
      delete next[sourceId];
    } else {
      next[sourceId] = option;
    }
  }
  return next;
}

/**
 * Combines lines with the same normalized ingredient id into rows, resolving
 * their quantities, sorted by ingredient category.
 */
export function combineIngredients(
  ingredients: RecipeIngredientDisplay[],
): CombinedIngredients[] {
  const groups = Object.groupBy(
    ingredients,
    (ingredient) => ingredient.normalizedIngredientId?.toString() ?? '',
  );

  const combined = Object.entries(groups)
    .map(([ingredientId, sources]) => {
      if (!sources || sources.length === 0) {
        return null;
      }

      const [quantity, unit] = resolveCombinedQuantity(sources, true);

      return {
        ingredientId,
        category: sources[0].category,
        name: sources[0].normalizedIngredientName ?? sources[0].name,
        quantity,
        unit,
        sourceIngredients: sources,
      };
    })
    .filter((row) => row !== null);

  return sortByIngredientCategory(combined);
}

/** Groups options by category, listing the given category first. */
export function groupWithCategoryFirst(
  items: IngredientForRecipeEdit[],
  firstCategory: string,
) {
  const grouped = Object.groupBy(items, (item) => item.category || 'Other');
  return Object.keys(grouped)
    .sort((a, b) => Number(b === firstCategory) - Number(a === firstCategory))
    .map((category) => ({ category, items: grouped[category] ?? [] }));
}
