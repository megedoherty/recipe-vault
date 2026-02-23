export const MEASUREMENT_OPTION = [
  'packet',
  'cup',
  'teaspoon',
  'tsp',
  'tablespoon',
  'tbsp',
  'oz',
  'ounce',
  'lb',
  'pound',
  'gram',
  'g(?!\\w)', // prevent matching "g" in "green", "garlic", etc.
  'ml',
  'milliliter',
  // Used for eggs, fruit
  'large',
  'medium',
  'small',
  // butter
  'stick',
] as const;

// TODO: two ingredients together
// 1 large egg + 1 egg yolk, at room temperature

// example: 1, 10, 1 1/2, 1 / 2, ⅕
export const numberRegex =
  /((?:\d+)? ?(?:and )?(?:\d+ ?\/ ?\d+)|(?:\d+ ?[½¼¾⅓⅔⅕⅖⅗⅘⅙⅔¾⅛⅜⅝⅞])|(?:\d+\.\d+)|(?:\d+|[½¼¾⅓⅔⅕⅖⅗⅘⅙⅔¾⅛⅜⅝⅞]))/;

// example: 1-2, 1 – 2, 1 to 2
export const numberRangeRegex = new RegExp(
  `${numberRegex.source}\\s?(?:-|–|to)\\s?${numberRegex.source}`,
);

// example: cup, cups, oz., lbs.
export const unitRegex = new RegExp(
  `(${MEASUREMENT_OPTION.join('|')})s?\\.?`,
  'i',
);

// example: 1 cup, 1 1/2 tablespoons
// result: [ "1 1/2 cups", "1 1/2", "cup" ]
export const quantityAndUnitRegex = new RegExp(
  `${numberRegex.source} ?${unitRegex.source}`,
);

export const simpleQuantityAndUnitLineRegex = new RegExp(
  `^${quantityAndUnitRegex.source}(?! plus| minus| \\+)`,
  'i',
);
export const SIMPLE_QUANTITY = 1;
export const SIMPLE_UNIT = 2;

// example: 1-2 cups, 1 – 2 cups, 1 to 2 cups
// result: [ "10 - 12 oz", "10 ", "12 ", "oz" ]
export const rangeQuantityAndUnitLineRegex = new RegExp(
  `^${numberRangeRegex.source}\\s?${unitRegex.source}`,
  'i',
);
export const RANGE_QUANTITY_1 = 1;
export const RANGE_QUANTITY_2 = 2;
export const RANGE_UNIT = 3;

// example: 1 cup plus 1 tablespoon, 1 cup + 1 tablespoon
// result: [ "1 cup plus 2 tablespoon", "1", "cup", "plus", "2", "tablespoon" ]
export const twoQuantitiesAndUnitsWithMathLineRegex = new RegExp(
  `^${quantityAndUnitRegex.source} ?(plus|\\+|minus|-) ?${quantityAndUnitRegex.source}`,
  'i',
);
export const MATH_OPERATOR = 3;
export const MATH_QUANTITY_1 = 1;
export const MATH_UNIT_1 = 2;
export const MATH_QUANTITY_2 = 4;
export const MATH_UNIT_2 = 5;

// example: yogurt or sour cream
export const ingredientWithOrOptions = /(.*)\sor\s(.*)/i;

// example: (1 ounce), (10 - 12 oz), [1 gram], (10 g), / 120 grams
// result: [ "(140 grams)", "140", undefined, "gram" ]
// result: [ "(100 - 200 grams)", "100", "200", "gram" ]
export const ouncesOrGramsInParenthesesRegex =
  /(?:\(|\[|\/ ?)(?:(\d+)(?: ?- ?(\d+))?) ?(ounce|oz|gram|g|ml|milliliter)s?(?:\)|\])?/;
export const METRIC_QUANTITY_1 = 1;
export const METRIC_QUANTITY_2 = 2;
export const METRIC_UNIT = 3;

// example: 340 - 453 g, 120 g (grams not in parentheses/brackets)
// result: [ "340 - 453 g", "340", "453" ]
// result: [ "120 g", "120", undefined ]
export const gramsWithOptionalRangeRegex =
  /^\s*(\d+)(?: ?- ?(\d+))? ?(?:gram|g)(?!\w)s?(?:\s|,|$)/i;

// example: 1 egg, 1 large egg, 2 egg yolks
// result: [ "1 egg", "1", undefined, "egg" ]
// result: [ "2 large egg yolks", "2", "large", "egg yolk" ]
export const eggLineRegex =
  /(\d+) (large|medium|small)? ?(egg ?(?:yolk|white)?s?)/i;
export const EGG_AMOUNT = 1;
export const EGG_SIZE = 2;
export const EGG_TYPE = 3;

// example 1 cup flour
// result: ["1 cup flour", "1", undefined, "cup flour"]
// result: ["1 - 2 cups flour", "1", "2", "cup flour"]
export const numbersAtBeginningOfLineRegex = new RegExp(
  `^${numberRegex.source} (?:(?:-|–|to) ${numberRegex.source} )?(.*)`,
);

// example: 1 banana, 30 oreos, 2 eggs
// result: ["1 banana", "1", "banana"]
// result: ["30 oreos", "30", "oreos"]
// result: ["1 1/2 bananas", "1 1/2", "1 1/2", "bananas"]
export const simpleNumberAndTextRegex = new RegExp(
  `^(${numberRegex.source})\\s+(.+)$`,
  'i',
);
export const SIMPLE_NUMBER = 1;
export const SIMPLE_TEXT = 3;

// Match anything in parentheses: "(120g)", "(114 g; 1 stick)", etc.
// result: ["(120g)", "120g"]
export const anythingInParenthesesRegex = /\([^)]+\)/;

// Number immediately before "tablespoon(s)" or "tbsp" — e.g. (8 tablespoons, 115 g), 4 tablespoons (50 g)
export const tablespoonsInTextRegex =
  /(\d+\.?\d*) ?(?:tablespoon|tbsp)s?(?:\s*[,)]|$)/i;
export const TABLESPOON_AMOUNT = 1;

// Cups at start: "½ cup", "1 cup", "1/2 cup"
export const cupsAtStartRegex = new RegExp(
  `^(${numberRegex.source}) ?cups?(?=\\s|$|\\))`,
  'i',
);
export const CUPS_AMOUNT = 1;

// Common non-numeric quantity terms
export const nonNumericQuantityTerms = [
  'dash',
  'pinch',
  'sprinkle',
  'smidgen',
  'drop',
  'drops',
  'splash',
  'drizzle',
  'handful',
  'handfuls',
  'generous',
  'to taste',
  'heavy pinch',
] as const;

// Match non-numeric quantity at the start of a line
// e.g. "dash salt", "pinch of pepper", "to taste"
// result: ["dash salt", "dash"]
// result: ["pinch of pepper", "pinch"]
export const nonNumericQuantityRegex = new RegExp(
  `^(${nonNumericQuantityTerms.join('|')})(?:\\s+of)?\\s+`,
  'i',
);
export const NON_NUMERIC_QUANTITY = 1;
