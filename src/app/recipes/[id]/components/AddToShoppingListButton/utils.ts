import { numericQuantity } from 'numeric-quantity';

import {
  CUPS_AMOUNT,
  cupsAtStartRegex,
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
import { RecipeIngredientDisplay } from '@/types';

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

// Combine ingredients with the same normalized ingredient id
export function combineGrams(
  ingredients: RecipeIngredientDisplay[] | undefined,
): number | null {
  // Safety check
  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  if (butterIds.includes(ingredients[0].normalizedIngredientId || 0)) {
    return null;
  }

  // See if each of the ingredients has a quantity that includes grams (in parentheses or plain "340 - 453 g")
  const grams = ingredients.map((ingredient) => {
    const q = ingredient.quantity;
    const parenMatch = q?.match(ouncesOrGramsInParenthesesRegex);
    if (parenMatch) {
      return Number(
        parenMatch[METRIC_QUANTITY_2] || parenMatch[METRIC_QUANTITY_1],
      );
    }
    const rangeMatch = q?.match(gramsWithOptionalRangeRegex);
    if (rangeMatch) {
      return Number(
        rangeMatch[METRIC_QUANTITY_2] || rangeMatch[METRIC_QUANTITY_1],
      );
    }
    return null;
  });

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
  ingredients: RecipeIngredientDisplay[] | undefined,
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
