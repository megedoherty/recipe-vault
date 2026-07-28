import { numericQuantity } from 'numeric-quantity';

import {
  CUPS_AMOUNT,
  cupsAtStartRegex,
  GRAMS_ANYWHERE_AMOUNT,
  gramsAnywhereRegex,
  gramsWithOptionalRangeRegex,
  MATH_OPERATOR,
  MATH_QUANTITY_1,
  MATH_QUANTITY_2,
  MATH_UNIT_1,
  MATH_UNIT_2,
  METRIC_QUANTITY_1,
  METRIC_QUANTITY_2,
  numberRegex,
  ouncesOrGramsInParenthesesRegex,
  quantityAndUnitRegex,
  SIMPLE_QUANTITY,
  SIMPLE_UNIT,
  simpleQuantityAndUnitLineRegex,
  TABLESPOON_AMOUNT,
  tablespoonsInTextRegex,
  twoQuantitiesAndUnitsWithMathLineRegex,
} from '@/lib/utils/regex';
import {
  CombinedShoppingListItem,
  ShoppingListByRecipe,
  ShoppingListItem,
} from '@/types';

// Minimal shape needed to combine quantities across ingredient lines,
// satisfied structurally by both RecipeIngredientDisplay and ShoppingListItem.
export interface QuantityLike {
  quantity: string | null;
  normalizedIngredientId: number | null;
}

export const conversionRates = {
  cup: {
    tablespoon: 1 / 16,
    teaspoon: 1 / 48,
  },
  tablespoon: {
    teaspoon: 1 / 3,
    cup: 16,
  },
  teaspoon: {
    tablespoon: 3,
    cup: 48,
  },
};

const onlyNumberRegex = new RegExp(`^\\s*${numberRegex.source}\\s*$`);

/** Convert a single quantity+unit to cups. Returns null if unit is not cup/tablespoon/teaspoon. */
function quantityAndUnitToCups(
  quantityStr: string,
  unitStr: string,
): number | null {
  const n = numericQuantity(quantityStr);
  if (Number.isNaN(n)) return null;
  const unit = unitStr.toLowerCase().replace(/s\.?$/, '');
  if (unit === 'cup') return n;
  if (unit === 'tablespoon') return n * conversionRates.cup.tablespoon;
  if (unit === 'teaspoon') return n * conversionRates.cup.teaspoon;
  return null;
}

/** Parse a quantity string (e.g. "2 cups", "1 cup + 2 tablespoons") to total cups. */
function quantityStringToCups(quantity: string | null): number | null {
  if (!quantity?.trim()) return null;

  const trimmed = quantity.trim();

  const mathMatch = trimmed.match(twoQuantitiesAndUnitsWithMathLineRegex);
  if (mathMatch) {
    const cups1 = quantityAndUnitToCups(
      mathMatch[MATH_QUANTITY_1],
      mathMatch[MATH_UNIT_1],
    );
    const cups2 = quantityAndUnitToCups(
      mathMatch[MATH_QUANTITY_2],
      mathMatch[MATH_UNIT_2],
    );
    if (cups1 !== null && cups2 !== null) {
      const op = mathMatch[MATH_OPERATOR]?.toLowerCase();
      return op === 'minus' || op === '-' ? cups1 - cups2 : cups1 + cups2;
    }
  }

  const simpleMatch = trimmed.match(simpleQuantityAndUnitLineRegex);
  if (simpleMatch) {
    return quantityAndUnitToCups(
      simpleMatch[SIMPLE_QUANTITY],
      simpleMatch[SIMPLE_UNIT],
    );
  }

  const qtyUnitMatch = trimmed.match(quantityAndUnitRegex);
  if (qtyUnitMatch) {
    return quantityAndUnitToCups(qtyUnitMatch[1], qtyUnitMatch[2]);
  }

  return null;
}

/** Format total cups per rules: >= 1 cup as decimal cups; < 1 cup as tbsp if whole number, else tsp. */
function formatVolume(totalCups: number): [number, string] {
  if (totalCups >= 1) {
    const cupLabel = totalCups === 1 ? 'cup' : 'cups';
    return [totalCups, cupLabel];
  }

  const totalTbsp = totalCups * conversionRates.tablespoon.cup;
  if (Number.isInteger(totalTbsp)) {
    const tbspLabel = totalTbsp === 1 ? 'tablespoon' : 'tablespoons';
    return [totalTbsp, tbspLabel];
  }

  const totalTsp = totalCups * conversionRates.teaspoon.cup;
  const tspRounded = Math.round(totalTsp * 100) / 100;
  const tspLabel = tspRounded === 1 ? 'teaspoon' : 'teaspoons';
  return [tspRounded, tspLabel];
}

// Special case: handle butter in tablespoons
const butterIds = [79, 80, 81, 82];
const BUTTER_TBSP_PER_STICK = 8;
const BUTTER_TBSP_PER_CUP = 16;
// 113 g per half-cup (1 stick), i.e. per 8 tablespoons.
const BUTTER_GRAMS_PER_TBSP = 113 / 8;

function unitToTbsp(quantityStr: string, unitStr: string): number | null {
  const n = numericQuantity(quantityStr);
  if (Number.isNaN(n)) return null;
  const unit = unitStr.toLowerCase().replace(/s\.?$/, '');
  if (unit === 'stick') return n * BUTTER_TBSP_PER_STICK;
  if (unit === 'tablespoon' || unit === 'tbsp') return n;
  if (unit === 'cup') return n * BUTTER_TBSP_PER_CUP;
  return null;
}

/**
 * Get tablespoon amount from a butter quantity line.
 * Handles: "(8 tablespoons, 115 g)", "4 tablespoons (50 g)", "3 sticks + 1 tablespoon (348 g)", "½ cup (110 g)".
 */
export function getTablespoonsFromButterLine(
  quantity: string | null,
): number | null {
  if (!quantity) return null;

  // 1) "3 sticks + 1 tablespoon" / "1 cup + 2 tablespoons" etc. (reuse twoQuantitiesAndUnitsWithMathLineRegex)
  const mathMatch = quantity.match(twoQuantitiesAndUnitsWithMathLineRegex);
  if (mathMatch) {
    const tbsp1 = unitToTbsp(
      mathMatch[MATH_QUANTITY_1],
      mathMatch[MATH_UNIT_1],
    );
    const tbsp2 = unitToTbsp(
      mathMatch[MATH_QUANTITY_2],
      mathMatch[MATH_UNIT_2],
    );
    if (tbsp1 !== null && tbsp2 !== null) {
      const op = mathMatch[MATH_OPERATOR]?.toLowerCase();
      return op === 'minus' || op === '-' ? tbsp1 - tbsp2 : tbsp1 + tbsp2;
    }
  }

  // 2) Single quantity+unit at start: "3 sticks (348 g)", "4 tablespoons (50 g)", "½ cup (110 g)"
  const simpleMatch = quantity.match(simpleQuantityAndUnitLineRegex);
  if (simpleMatch) {
    const tbsp = unitToTbsp(
      simpleMatch[SIMPLE_QUANTITY],
      simpleMatch[SIMPLE_UNIT],
    );
    if (tbsp !== null) return tbsp;
  }

  // 3) Explicit tablespoons in text (e.g. "(8 tablespoons, 115 g)" when not at start)
  const tbspMatch = quantity.match(tablespoonsInTextRegex);
  if (tbspMatch) {
    const n = Number(tbspMatch[TABLESPOON_AMOUNT]);
    if (!Number.isNaN(n)) return n;
  }

  // 4) Cups at start (e.g. "½ cup" — fallback if simpleQuantity didn't match)
  const cupsMatch = quantity.match(cupsAtStartRegex);
  if (cupsMatch) {
    const cups = numericQuantity(cupsMatch[CUPS_AMOUNT]);
    if (!Number.isNaN(cups)) return Math.round(cups * BUTTER_TBSP_PER_CUP);
  }

  return null;
}

/**
 * Get the gram amount from a butter quantity line, preferring an embedded
 * gram value (e.g. "1 cup (16 Tbsp; 226 g)") over deriving it from tablespoons
 * via BUTTER_GRAMS_PER_TBSP, since the recipe's own stated grams are more
 * precise than a generic per-tablespoon conversion.
 */
export function getGramsFromButterLine(quantity: string | null): number | null {
  if (!quantity) return null;

  const gramsMatch = quantity.match(gramsAnywhereRegex);
  if (gramsMatch) {
    const n = Number(gramsMatch[GRAMS_ANYWHERE_AMOUNT]);
    if (!Number.isNaN(n)) return n;
  }

  const tbsp = getTablespoonsFromButterLine(quantity);
  return tbsp !== null ? tbsp * BUTTER_GRAMS_PER_TBSP : null;
}

// Grams-per-cup density for common baking staples, keyed by normalizedIngredientId.
// Lets convertToGramsViaDensity convert a cup measurement to grams so it can combine
// with another recipe's gram measurement for the same ingredient (e.g. "1 cup
// flour" + "60 g flour"). Values from the King Arthur Flour ingredient weight
// chart, unless noted otherwise. Butter (ids 78-82) is excluded — it has its
// own dedicated tablespoon-based conversion (BUTTER_GRAMS_PER_TBSP) above.
const GRAMS_PER_CUP: Record<number, number> = {
  1: 120, // All-purpose flour
  2: 120, // Bread flour
  3: 120, // Cake flour
  4: 113, // Self-rising flour
  8: 152, // Potato starch
  9: 96, // Almond flour
  10: 142, // Rice flour
  11: 128, // Coconut flour
  12: 106, // Rye flour
  13: 113, // Whole wheat flour
  14: 92, // Oat flour
  15: 198, // Granulated sugar
  16: 213, // Brown sugar
  17: 213, // Light brown sugar
  18: 213, // Dark brown sugar
  19: 113.5, // Powdered sugar
  20: 180, // Turbinado sugar
  21: 336, // Honey (derived: 21 g/tbsp x 16)
  22: 312, // Maple syrup
  23: 340, // Molasses
  26: 312, // Light corn syrup
  41: 170, // Chocolate chips
  42: 170, // Semi-sweet chocolate chips
  43: 177, // Mini semi-sweet chocolate chips
  44: 170, // Milk chocolate chips
  45: 170, // Dark chocolate chips
  46: 170, // White chocolate chips
  57: 84, // Cocoa powder
  58: 84, // Unsweetened cocoa powder
  59: 84, // Dutch processed cocoa powder
  60: 84, // Black cocoa powder
  84: 227, // Milk
  93: 224, // Olive oil (derived: 14 g/tbsp x 16)
  94: 226, // Coconut oil
  199: 89, // Oats
  200: 89, // Quick oats
  201: 89, // Rolled oats
  205: 138, // Cornmeal
  209: 192, // Baking powder (derived: 4 g/tsp x 48)
  210: 288, // Baking soda (derived: 6 g/tsp x 48)
  214: 112, // Cornstarch
};

/** Extract a gram amount already embedded in a quantity string (e.g. "1 cup (120 g)", "340 g"). */
function extractGrams(quantity: string | null): number | null {
  const parenMatch = quantity?.match(ouncesOrGramsInParenthesesRegex);
  if (parenMatch) {
    return Number(
      parenMatch[METRIC_QUANTITY_2] || parenMatch[METRIC_QUANTITY_1],
    );
  }
  const rangeMatch = quantity?.match(gramsWithOptionalRangeRegex);
  if (rangeMatch) {
    return Number(
      rangeMatch[METRIC_QUANTITY_2] || rangeMatch[METRIC_QUANTITY_1],
    );
  }
  return null;
}

// Combine ingredients with the same normalized ingredient id
export function combineGrams(
  ingredients: QuantityLike[] | undefined,
): number | null {
  // Safety check
  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  if (butterIds.includes(ingredients[0].normalizedIngredientId || 0)) {
    return null;
  }

  // See if each of the ingredients has a quantity that includes grams (in parentheses or plain "340 - 453 g")
  const grams = ingredients.map((ingredient) =>
    extractGrams(ingredient.quantity),
  );

  if (grams.every((gram) => gram !== null)) {
    // Combine the grams
    const combinedGrams = grams.reduce((acc, gram) => {
      return acc + gram;
    }, 0);
    return combinedGrams;
  }

  return null;
}

export function combineNonGramsQuantity(
  ingredients: QuantityLike[] | undefined,
): [number, string] | null {
  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  // Handle butter - we want to return tablespoons
  if (butterIds.includes(ingredients[0].normalizedIngredientId || 0)) {
    const tbspValues = ingredients
      .map((ing) => getTablespoonsFromButterLine(ing.quantity))
      .filter((n): n is number => n !== null);
    if (tbspValues.length > 0) {
      const total = tbspValues.reduce((a, b) => a + b, 0);
      return [total, 'tablespoon'];
    }
  }

  // If every quantity is literally just a number (e.g. "3", "1 1/2"), add them
  const numericValues = ingredients.map((ingredient) => {
    if (!ingredient.quantity) return null;

    const match = ingredient.quantity.match(onlyNumberRegex);
    if (!match?.[1]) return null;

    const n = numericQuantity(match[1]);
    return Number.isNaN(n) ? null : n;
  });
  if (numericValues.every((n): n is number => n !== null)) {
    const total = numericValues.reduce((acc, n) => acc + n, 0);
    return [total, ''];
  }

  // Handle quantities with units (cup/tablespoon/teaspoon): convert to cups, add, then format
  const cupValues = ingredients.map((ing) =>
    quantityStringToCups(ing.quantity),
  );
  if (cupValues.every((c): c is number => c !== null)) {
    const totalCups = cupValues.reduce((acc, c) => acc + c, 0);
    if (totalCups > 0) {
      return formatVolume(totalCups);
    }
  }

  return null;
}

/**
 * Last-resort fallback for combining a genuinely mixed-unit group (e.g. one
 * recipe's "1 cup flour" alongside another's "60 g flour"). Converts every
 * ingredient to grams — via embedded grams first, then via GRAMS_PER_CUP
 * density if the ingredient is mapped — and sums. Returns null if the
 * ingredient has no density entry, or any line can't be resolved to grams.
 */
export function convertToGramsViaDensity(
  ingredients: QuantityLike[] | undefined,
): number | null {
  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  if (butterIds.includes(ingredients[0].normalizedIngredientId || 0)) {
    const gramValues = ingredients
      .map((ing) => getGramsFromButterLine(ing.quantity))
      .filter((n): n is number => n !== null);
    if (gramValues.length !== ingredients.length) {
      return null;
    }
    return gramValues.reduce((acc, grams) => acc + grams, 0);
  }

  const gramsPerCup =
    GRAMS_PER_CUP[ingredients[0].normalizedIngredientId ?? -1];
  if (!gramsPerCup) {
    return null;
  }

  const grams = ingredients.map((ingredient) => {
    const extracted = extractGrams(ingredient.quantity);
    if (extracted !== null) {
      return extracted;
    }

    const cups = quantityStringToCups(ingredient.quantity);
    return cups !== null ? cups * gramsPerCup : null;
  });

  if (!grams.every((gram): gram is number => gram !== null)) {
    return null;
  }

  return grams.reduce((acc, gram) => acc + gram, 0);
}

/**
 * Mirror of convertToGramsViaDensity for the opposite direction: converts every
 * ingredient to cups — via an already-cup-convertible quantity first, then via
 * GRAMS_PER_CUP density if the ingredient only has an embedded gram value — and
 * sums, formatting the total via formatVolume. Returns null if the ingredient
 * has no density entry, or any line can't be resolved to cups.
 */
export function convertToCupsViaDensity(
  ingredients: QuantityLike[] | undefined,
): [number, string] | null {
  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  if (butterIds.includes(ingredients[0].normalizedIngredientId || 0)) {
    const tbspValues = ingredients
      .map((ing) => getTablespoonsFromButterLine(ing.quantity))
      .filter((n): n is number => n !== null);
    if (tbspValues.length !== ingredients.length) {
      return null;
    }
    const totalTbsp = tbspValues.reduce((acc, tbsp) => acc + tbsp, 0);
    return formatVolume(totalTbsp * conversionRates.cup.tablespoon);
  }

  const gramsPerCup =
    GRAMS_PER_CUP[ingredients[0].normalizedIngredientId ?? -1];
  if (!gramsPerCup) {
    return null;
  }

  const cups = ingredients.map((ingredient) => {
    const parsedCups = quantityStringToCups(ingredient.quantity);
    if (parsedCups !== null) {
      return parsedCups;
    }

    const grams = extractGrams(ingredient.quantity);
    return grams !== null ? grams / gramsPerCup : null;
  });

  if (!cups.every((cup): cup is number => cup !== null)) {
    return null;
  }

  const totalCups = cups.reduce((acc, cup) => acc + cup, 0);
  return totalCups > 0 ? formatVolume(totalCups) : null;
}

/**
 * Resolves a single group's combined quantity + unit, given priority to the
 * unit `preferGrams` selects:
 *  1. If every line already natively resolves in the preferred unit (i.e.
 *     every line has embedded grams, or every line is already cup/tbsp/tsp),
 *     use that directly — the recipes' own stated amounts take priority over
 *     any conversion.
 *  2. Otherwise, if the ingredient has a GRAMS_PER_CUP density entry, convert
 *     every line into the preferred unit (convertToGramsViaDensity /
 *     convertToCupsViaDensity) — this is the fallback for mixed-unit groups
 *     or groups that are natively only in the other unit.
 *  3. Otherwise, fall back to whichever unit combines natively (the other
 *     unit), so a resolvable quantity is never silently dropped.
 */
export function resolveCombinedQuantity(
  groupItems: QuantityLike[],
  preferGrams: boolean,
): [number | null, string | null] {
  const gramsQuantity = combineGrams(groupItems);
  const [nonGramsQuantity, unit] = combineNonGramsQuantity(groupItems) ?? [
    null,
    null,
  ];

  if (preferGrams) {
    const densityGrams =
      gramsQuantity == null ? convertToGramsViaDensity(groupItems) : null;
    return [
      gramsQuantity ?? densityGrams ?? nonGramsQuantity,
      gramsQuantity != null || densityGrams != null ? 'g' : unit,
    ];
  }

  const densityCups =
    nonGramsQuantity == null ? convertToCupsViaDensity(groupItems) : null;
  return [
    nonGramsQuantity ?? densityCups?.[0] ?? gramsQuantity,
    nonGramsQuantity != null
      ? unit
      : densityCups != null
        ? densityCups[1]
        : gramsQuantity != null
          ? 'g'
          : null,
  ];
}

/**
 * Groups shopping list items by normalized ingredient id, combining quantities
 * across recipes. Items with no normalizedIngredientId fall back to grouping by
 * lowercased raw name, so unmatched ingredients with the same name still combine.
 * See resolveCombinedQuantity for the per-group unit priority order.
 */
export function groupCombined(
  items: ShoppingListItem[],
  preferGrams: boolean = true,
): CombinedShoppingListItem[] {
  const groups = Object.groupBy(items, (item) =>
    item.normalizedIngredientId != null
      ? item.normalizedIngredientId.toString()
      : `name:${item.name.toLowerCase().trim()}`,
  );

  return Object.entries(groups)
    .map(([groupKey, groupItems]) => {
      if (!groupItems || groupItems.length === 0) {
        return null;
      }

      const [quantity, resultUnit] = resolveCombinedQuantity(
        groupItems,
        preferGrams,
      );

      return {
        groupKey,
        name: groupItems[0].normalizedIngredientName ?? groupItems[0].name,
        category: groupItems[0].category,
        quantity,
        unit: resultUnit,
        purchased: groupItems.every((item) => item.purchased),
        sourceItemIds: groupItems.map((item) => item.id),
        lines: groupItems.map((item) =>
          `${item.quantity ?? ''} ${item.name} (${item.recipeName ?? 'Manually Added'})`.trim(),
        ),
      };
    })
    .filter((group): group is CombinedShoppingListItem => group !== null);
}

/**
 * Groups shopping list items by recipe, with a "Manually Added" group for
 * items with no recipeId.
 */
export function groupByRecipe(
  items: ShoppingListItem[],
): ShoppingListByRecipe[] {
  const groups = Object.groupBy(items, (item) => item.recipeId ?? 'manual');

  return Object.entries(groups)
    .map(([recipeId, groupItems]) => {
      if (!groupItems || groupItems.length === 0) {
        return null;
      }

      return {
        recipeId: recipeId === 'manual' ? null : recipeId,
        recipeName: groupItems[0].recipeName ?? 'Manually Added',
        items: groupItems,
      };
    })
    .filter((group): group is ShoppingListByRecipe => group !== null);
}
