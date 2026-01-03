import { EditableIngredient, IngredientSections } from '@/types';

import {
  anythingInParenthesesRegex,
  EGG_AMOUNT,
  EGG_SIZE,
  eggLineRegex,
  rangeQuantityAndUnitLineRegex,
  SIMPLE_NUMBER,
  simpleNumberAndTextRegex,
  simpleQuantityAndUnitLineRegex,
  twoQuantitiesAndUnitsWithMathLineRegex,
} from './regex';

export function parseTextareaToArray(text: string | undefined): string[] {
  if (!text) return [];

  return text.split(/\r?\n/).filter(Boolean);
}

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
export function standardizeQuantity(quantity: string): string {
  // Remove "and" from mixed fractions (e.g., "1 and 1/2" -> "1 1/2")
  // Only match "and" when it's between a number and a fraction
  const normalized = quantity.replace(
    /(\d+)\s+and\s+(\d+\s*\/\s*\d+)/gi,
    '$1 $2',
  );

  return replaceFractions(normalized);
}

type ParsedIngredient = Pick<EditableIngredient, 'name' | 'quantity'>;

function parseNameWithQuantity(
  line: string,
  quantity: string,
): ParsedIngredient {
  // Get name based on provided quantity
  let name = line.substring(quantity.length).trim();

  // If the name starts with parentheses, extract the additional quantity info from the parentheses
  const parenthesesMatch = name.startsWith('(')
    ? name.match(anythingInParenthesesRegex)
    : null;
  if (parenthesesMatch) {
    name = name.replace(parenthesesMatch[0], '').trim();
    quantity += ' ' + parenthesesMatch[0];
  }

  if (!name) {
    console.error(`Unable to parse ${line} for name!`);
    return { name: line, quantity: null };
  }

  return { name, quantity: standardizeQuantity(quantity) };
}

function parseIngredientLine(line: string): ParsedIngredient {
  // Do some standardization first: trim
  // Remove extra spaces inside parentheses: "( 12g)" -> "(12g)", "(12g )" -> "(12g)"
  let trimmedLine = line.trim().replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');

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

export function parseIngredients(
  text: string | undefined,
): IngredientSections[] {
  if (!text) return [];

  const lines = text.split(/\r?\n/).filter(Boolean);
  const sections = lines.reduce((acc: IngredientSections[], line) => {
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
      });
    }

    return acc;
  }, []);

  return sections;
}
