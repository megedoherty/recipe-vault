import {
  IngredientForRecipeEdit,
  InstructionSection,
  RecipeEditableIngredient,
  RecipeIngredientSectionsEditable,
} from '@/types';

import {
  anythingInParenthesesRegex,
  EGG_AMOUNT,
  EGG_SIZE,
  eggLineRegex,
  NON_NUMERIC_QUANTITY,
  nonNumericQuantityRegex,
  nonNumericQuantityTerms,
  rangeQuantityAndUnitLineRegex,
  SIMPLE_NUMBER,
  simpleNumberAndTextRegex,
  simpleQuantityAndUnitLineRegex,
  twoQuantitiesAndUnitsWithMathLineRegex,
} from './regex';

const FRACTION_MAP: Record<string, string> = {
  '1/2': '½',
  '1/4': '¼',
  '3/4': '¾',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/5': '⅕',
  '2/5': '⅖',
  '3/5': '⅗',
  '4/5': '⅘',
  '1/6': '⅙',
  '5/6': '⅚',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞',
};

// Replace fractions with optional spaces around the slash
// Matches: "1/2", "1 / 2", "3/4", etc.
function replaceFractions(text: string): string {
  return text.replace(/(\d+)\s*\/\s*(\d+)/g, (match, num, den) => {
    const fraction = `${num}/${den}`;
    return FRACTION_MAP[fraction] || match;
  });
}

// Convert brackets to parentheses
function convertBracketsToParentheses(text: string): string {
  return text.replace(/\[/g, '(').replace(/\]/g, ')');
}

export function standardizeQuantity(quantity: string): string {
  // Handle non-numeric quantities (just return as-is, lowercase)
  if (
    nonNumericQuantityTerms.some(
      (term) => term.toLowerCase() === quantity.toLowerCase(),
    )
  ) {
    return quantity.toLowerCase();
  }

  // Remove "and" from mixed fractions (e.g., "1 and 1/2" -> "1 1/2")
  // Only match "and" when it's between a number and a fraction
  const normalized = quantity
    .replace(/(\d+)\s+and\s+(\d+\s*\/\s*\d+)/gi, '$1 $2')
    .toLowerCase();

  const withSpacedGrams = normalized.replace(/(\d+)(g\b)/g, '$1 $2');

  return replaceFractions(withSpacedGrams);
}

type ParsedIngredient = Pick<RecipeEditableIngredient, 'name' | 'quantity'>;

function parseNameWithQuantity(
  line: string,
  quantity: string,
): ParsedIngredient {
  // Convert brackets to parentheses in the entire line first
  const normalizedLine = convertBracketsToParentheses(line);
  let normalizedQuantity = convertBracketsToParentheses(quantity);

  // Get name based on provided quantity
  let name = normalizedLine
    .substring(normalizedQuantity.length)
    .trim()
    .toLowerCase();

  // Remove the word packed if it exists - usually brown sugar
  name = name
    .replace(/\s*tightly\s*/gi, ' ')
    .replace(/^packed\s+/i, '')
    .replace(/,\s*packed\s*$/i, '')
    .replace(/\s*\(packed\)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Standardize room temperature, make it ", room temperature"
  if (/\broom\s*temperature\b/i.test(name)) {
    name = name
      .replace(
        /\s*,\s*(?:softened\s+to\s+)?(?:at\s+)?room\s*temperature\s*/gi,
        '',
      )
      .replace(/\s*(?:softened\s+to\s+)?(?:at\s+)?room\s*temperature\s*/gi, '')
      .replace(/\s*softened\s*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Add ", room temperature" at the end if not already present
    if (!name.endsWith(', room temperature')) {
      name = name + ', room temperature';
    }
  }

  // If the name starts with parentheses, extract the additional quantity info from the parentheses
  const parenthesesMatch = name.startsWith('(')
    ? name.match(anythingInParenthesesRegex)
    : null;
  if (parenthesesMatch) {
    name = name.replace(parenthesesMatch[0], '').trim();
    normalizedQuantity += ' ' + parenthesesMatch[0];
  }

  if (!name) {
    console.error(`Unable to parse ${line} for name!`);
    return { name: line, quantity: null };
  }

  return { name, quantity: standardizeQuantity(normalizedQuantity) };
}

function parseIngredientLine(line: string): ParsedIngredient {
  // Convert brackets to parentheses in the entire line first
  let trimmedLine = convertBracketsToParentheses(line.trim());

  // Do some standardization: trim
  // Remove extra spaces inside parentheses: "( 12g)" -> "(12g)", "(12g )" -> "(12g)"
  trimmedLine = trimmedLine.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');

  // Remove "optional:" prefix, and add it as a suffix. This makes parsing easier.
  if (/^optional:\s+/i.test(trimmedLine)) {
    trimmedLine = trimmedLine.replace(/^optional:\s+/i, '') + ' (optional)';
  }

  // e.g. "1 cup + 2 tablespoons sugar"
  const twoQuantities = trimmedLine.match(
    twoQuantitiesAndUnitsWithMathLineRegex,
  );
  if (twoQuantities) {
    return parseNameWithQuantity(trimmedLine, twoQuantities[0]);
  }

  // e.g. "10 - 12 oz chocolate"
  const rangeMatch = trimmedLine.match(rangeQuantityAndUnitLineRegex);
  if (rangeMatch) {
    return parseNameWithQuantity(trimmedLine, rangeMatch[0]);
  }

  // e.g. "1 egg"
  const eggMatch = trimmedLine.match(eggLineRegex);
  if (eggMatch) {
    // Special case for eggs: assume large so remove the size from the quantity
    return parseNameWithQuantity(
      trimmedLine.replace(
        eggMatch[EGG_SIZE] === 'large' ? eggMatch[EGG_SIZE] : '',
        '',
      ),
      eggMatch[EGG_AMOUNT],
    );
  }

  // e.g. "dash salt", "pinch of pepper"
  const nonNumericMatch = trimmedLine.match(nonNumericQuantityRegex);
  if (nonNumericMatch) {
    // Extract the quantity term (e.g., "dash", "pinch")
    const quantityTerm = nonNumericMatch[NON_NUMERIC_QUANTITY].toLowerCase();
    // Remove the quantity term and "of" if present to get the ingredient name
    // Escape special regex characters in quantityTerm for safe regex construction
    const escapedQuantityTerm = quantityTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );
    const name = trimmedLine
      .replace(new RegExp(`^${escapedQuantityTerm}(?:\\s+of)?\\s+`, 'i'), '')
      .trim();
    if (!name) {
      console.error(`Unable to parse ${line} for name!`);
      return { name: line, quantity: null };
    }
    return { name, quantity: quantityTerm };
  }

  // e.g. "1 cup flour"
  const simpleMatch = trimmedLine.match(simpleQuantityAndUnitLineRegex);
  if (simpleMatch) {
    return parseNameWithQuantity(trimmedLine, simpleMatch[0]);
  }

  // e.g. "30 oreos"
  const noUnitMatch = trimmedLine.match(simpleNumberAndTextRegex);
  if (noUnitMatch) {
    return parseNameWithQuantity(trimmedLine, noUnitMatch[SIMPLE_NUMBER]);
  }

  console.error(`Unable to parse ${line} for quantity!`);
  return { name: line, quantity: null };
}

const specialCaseMappings: Array<{
  match: (name: string) => boolean;
  ingredientName: string;
}> = [
  {
    match: (n) =>
      n.includes('egg') && !n.includes('yolk') && !n.includes('white'),
    ingredientName: 'whole egg',
  },
  {
    match: (n) => n.startsWith('salt') || n.includes('sea salt'),
    ingredientName: 'table salt',
  },
  {
    match: (n) => n.startsWith('vinegar'),
    ingredientName: 'white vinegar',
  },
  {
    match: (n) => n.startsWith('confectioner'),
    ingredientName: 'powdered sugar',
  },
  {
    match: (n) => n.startsWith('brown sugar'),
    ingredientName: 'light brown sugar',
  },
  {
    match: (n) => n.startsWith('sugar'),
    ingredientName: 'granulated sugar',
  },
  {
    match: (n) => n.startsWith('corn syrup'),
    ingredientName: 'light corn syrup',
  },
  {
    match: (n) => n.includes('graham cracker crumbs'),
    ingredientName: 'graham crackers',
  },
  {
    match: (n) => n.includes('cinnamon'),
    ingredientName: 'ground cinnamon',
  },
  {
    match: (n) => n.includes('canola oil'),
    ingredientName: 'vegetable oil',
  },
  {
    match: (n) => n.includes('process cocoa powder'),
    ingredientName: 'dutch processed cocoa powder',
  },
  {
    match: (n) => n.includes('unsalted butter') || n.startsWith('butter'),
    ingredientName: 'unsalted butter',
  },
  {
    match: (n) => n.startsWith('cocoa powder'),
    ingredientName: 'unsweetened cocoa powder',
  },
  {
    match: (n) =>
      n.startsWith('flour') ||
      n.includes('all purpose') ||
      n.startsWith('ap flour'),
    ingredientName: 'all-purpose flour',
  },
  {
    match: (n) => n.startsWith('peanut butter'),
    ingredientName: 'creamy peanut butter',
  },
];

function findClosestIngredient(
  name: string,
  allIngredients: IngredientForRecipeEdit[],
): string | null {
  // Check some special cases first
  const lowercaseName = name.toLowerCase();

  // Handle special cases
  // Check special cases
  for (const { match, ingredientName } of specialCaseMappings) {
    if (match(lowercaseName)) {
      const found = allIngredients.find(
        (ingredient) => ingredientName === ingredient.name,
      );
      if (found) {
        return found.id;
      }
    }
  }

  // Look for an exact match
  const splitName = lowercaseName.split(/,\s*|\s+or\s+|\(/)[0].trim();
  const exactMatch = allIngredients.find(
    (ingredient) => ingredient.name.toLowerCase() === splitName,
  );
  if (exactMatch) {
    return exactMatch.id;
  }

  // Look for a partial match
  return (
    allIngredients.find((ingredient) =>
      lowercaseName.includes(ingredient.name.toLowerCase()),
    )?.id ?? null
  );
}

export function parseIngredients(
  text: string | undefined,
  ingredients: IngredientForRecipeEdit[],
): RecipeIngredientSectionsEditable[] {
  if (!text) return [];

  const lowercaseIngredients = ingredients.map((ingredient) => ({
    ...ingredient,
    name: ingredient.name.toLowerCase(),
  }));

  const lines = text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.replace(/^[\s▢•\-\*\+]\s*/, '')); // Remove special chars from start

  const sections = lines.reduce(
    (acc: RecipeIngredientSectionsEditable[], line) => {
      // Check if this line is a section header (ends with colon)
      if (line.trim().endsWith(':')) {
        const sectionName = line.replace(':', '').trim();
        acc.push({
          id: crypto.randomUUID(), // used for key in the UI
          title: sectionName,
          ingredients: [],
        });
      } else {
        // This is an ingredient line - add it to the current section
        // If no section exists yet, create a default one
        if (acc.length === 0) {
          acc.push({ id: crypto.randomUUID(), title: null, ingredients: [] });
        }

        // Parse the ingredient and add it to the last section
        const parsed = parseIngredientLine(line);
        acc[acc.length - 1].ingredients.push({
          name: parsed.name,
          quantity: parsed.quantity,
          id: crypto.randomUUID(),
          section: null,
          ingredientId: findClosestIngredient(
            parsed.name,
            lowercaseIngredients,
          ),
        });
      }

      return acc;
    },
    [],
  );

  return sections;
}

export function parseInstructions(text: string): InstructionSection[] {
  if (!text) return [];

  const lines = text.split(/\r?\n/).filter(Boolean);
  const sections = lines.reduce((acc: InstructionSection[], line) => {
    if (line.trim().endsWith(':')) {
      const sectionName = line.replace(':', '').trim();
      acc.push({
        id: crypto.randomUUID(),
        title: sectionName,
        steps: [],
      });
    } else {
      // Create empty section if none exists
      if (acc.length === 0) {
        acc.push({ id: crypto.randomUUID(), title: null, steps: [] });
      }

      acc[acc.length - 1].steps.push({
        text: line,
        id: crypto.randomUUID(),
      });
    }

    return acc;
  }, []);

  return sections;
}
