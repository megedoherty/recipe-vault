import * as cheerio from 'cheerio';

const excludeLineStartsWith = [
  'Ingredients',
  'Instructions',
  'Directions',
  'Method',
  'Preparation',
];

const ingredientSelectors = [
  // Common selectors
  '.tasty-recipes-ingredients',
  '.wprm-recipe-ingredients-container',
  '.ingredients',
  '.recipe__ingredients',
  // Unique
  '[class*="ingredients_ingredients"]', // for NYT Cooking
  '[data-testid="IngredientList"]', // for Bon Appetit
  '.section--ingredients', // Serious Eats
];

const instructionCssSelectors = [
  // Common selectors
  '.tasty-recipes-instructions',
  '.wprm-recipe-instructions-container',
  '.instructions',
  '.recipe__instructions',
  // Unique
  '[class*="recipebody_prep-block"]', // For NYT Cooking
  '[data-testid="InstructionsWrapper"]', // for Bon Appetit
  '.section--instructions', // Serious Eats
];

export const findIngredientsOrInstructions = (
  $: cheerio.CheerioAPI,
  type: 'ingredients' | 'instructions',
) => {
  const section = $(
    type === 'ingredients'
      ? ingredientSelectors.join(', ')
      : instructionCssSelectors.join(', '),
  );
  const content: string[] = [];

  section.find('h1, h2, h3, h4, h5, h6, li').each((_, el) => {
    const text = $(el)
      .text()
      .replace(/[\s\t\n\r]+/g, ' ')
      .trim();

    if (excludeLineStartsWith.some((prefix) => text.startsWith(prefix))) {
      return;
    } else if (el.tagName === 'li') {
      content.push(text);
    } else {
      content.push(`${text}${text.endsWith(':') ? '' : ':'}`);
    }
  });

  return content.join('\n');
};
