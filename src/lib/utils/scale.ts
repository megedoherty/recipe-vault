import { numericQuantity } from 'numeric-quantity';

import { FRACTION_MAP } from './parse';
import { numberRegex } from './regex';

const FRACTION_TOLERANCE = 0.02;

// [value, symbol] pairs, e.g. [0.5, '½']
const FRACTIONS = Object.entries(FRACTION_MAP)
  .map(([fraction, symbol]) => {
    const [numerator, denominator] = fraction.split('/').map(Number);
    return [numerator / denominator, symbol] as const;
  })
  .sort(([a], [b]) => a - b);

const SEGMENT_REGEX = new RegExp(`\\([^)]*\\)|${numberRegex.source}`, 'g');
// "1 (14 oz) can" - the parenthetical describes the package, not an amount
const PACKAGE_SIZE_REGEX = new RegExp(`^\\s*${numberRegex.source}\\s*\\(`);

const METRIC_UNIT_REGEX = /^\s?(?:g|grams?|ml|milliliters?|oz|ounces?|lbs?)\b/i;
const COUNTABLE_UNIT_REGEX =
  /^(\s?)(cup|teaspoon|tablespoon|stick|packet|ounce|pound)(s?)\b/i;

function trimDecimal(value: number, digits: number): string {
  return value
    .toFixed(digits)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '');
}

function formatAmount(value: number, isMetric: boolean): string {
  if (isMetric) {
    return trimDecimal(value, value >= 10 ? 0 : 1);
  }

  const whole = Math.floor(value);
  const remainder = value - whole;

  if (remainder < FRACTION_TOLERANCE) {
    return String(whole);
  }
  if (remainder > 1 - FRACTION_TOLERANCE) {
    return String(whole + 1);
  }

  const closest = FRACTIONS.find(
    ([fractionValue]) =>
      Math.abs(fractionValue - remainder) < FRACTION_TOLERANCE,
  );
  if (closest) {
    return whole > 0 ? `${whole} ${closest[1]}` : closest[1];
  }

  return trimDecimal(value, 2);
}

function scaleNumbers(text: string, factor: number): string {
  let result = '';
  let lastIndex = 0;

  for (const match of text.matchAll(new RegExp(numberRegex.source, 'g'))) {
    const token = match[0];
    const amount = numericQuantity(token.replace(/\band\s+/i, ''));
    if (Number.isNaN(amount)) continue;

    const end = match.index + token.length;
    const rest = text.slice(end);
    const scaled = amount * factor;
    const formatted = formatAmount(scaled, METRIC_UNIT_REGEX.test(rest));

    result += text.slice(lastIndex, match.index) + formatted;
    lastIndex = end;

    const unitMatch = rest.match(COUNTABLE_UNIT_REGEX);
    if (unitMatch) {
      const [unitText, space, unit] = unitMatch;
      const plural = scaled > 1 ? 's' : '';
      result += `${space}${unit}${plural}`;
      lastIndex = end + unitText.length;
    }
  }

  return result + text.slice(lastIndex);
}

/**
 * Multiplies every amount in a free-text ingredient quantity by `factor`,
 * e.g. "1 1/2 cups (190 g)" x 2 -> "3 cups (380 g)". Handles ranges and
 * "+"/"-" expressions, and leaves quantities with no amount ("pinch")
 * untouched.
 */
export function scaleQuantity(
  quantity: string | null,
  factor: number,
): string | null {
  if (quantity == null || factor === 1 || !(factor > 0)) return quantity;

  const skipParentheses = PACKAGE_SIZE_REGEX.test(quantity);
  let result = '';
  let lastIndex = 0;

  for (const match of quantity.matchAll(SEGMENT_REGEX)) {
    const segment = match[0];
    const isParenthetical = segment.startsWith('(');
    // Numbers outside parentheses are handled in one pass below
    if (!isParenthetical) continue;

    result += scaleNumbers(quantity.slice(lastIndex, match.index), factor);
    result += skipParentheses
      ? segment
      : `(${scaleNumbers(segment.slice(1, -1), factor)})`;
    lastIndex = match.index + segment.length;
  }

  return result + scaleNumbers(quantity.slice(lastIndex), factor);
}
