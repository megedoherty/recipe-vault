/**
 * Creates a sort comparator that orders items based on a stored order array.
 * Items not in the order array are placed at the end, maintaining their relative order.
 */
export function sortByOrder<T>(
  order: readonly string[],
  getKey: (item: T) => string | null,
): (a: T, b: T) => number {
  return (a, b) => {
    const indexA = order.indexOf(getKey(a) ?? '');
    const indexB = order.indexOf(getKey(b) ?? '');
    // Items not in the order array go to the end, maintaining their relative order
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  };
}

/** Category names that sort to the top when using sortByIngredientCategory. */
export const PRIORITY_INGREDIENT_CATEGORIES = [
  'Flours & Starches',
  'Sugars & Sweeteners',
  'Eggs',
  'Baking Essentials',
  'Chocolate & Baking Chips',
  'Extracts & Flavorings',
  'Dairy',
  'Fats & Oils',
];

/**
 * Sorts items by ingredient category: priority categories first (in order), then
 * alphabetically by category, then by name. Safe to use in components; returns a new array.
 */
export function sortByIngredientCategory<
  T extends { category: string; name: string },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aPriority = PRIORITY_INGREDIENT_CATEGORIES.indexOf(a.category);
    const bPriority = PRIORITY_INGREDIENT_CATEGORIES.indexOf(b.category);

    const aIdx = aPriority === -1 ? Number.MAX_SAFE_INTEGER : aPriority;
    const bIdx = bPriority === -1 ? Number.MAX_SAFE_INTEGER : bPriority;

    if (aIdx !== bIdx) return aIdx - bIdx;
    const categoryCompare = (a.category || '').localeCompare(b.category || '');
    if (categoryCompare !== 0) return categoryCompare;
    return a.name.localeCompare(b.name);
  });
}
