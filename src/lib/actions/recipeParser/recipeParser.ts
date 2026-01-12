'use server';

import * as cheerio from 'cheerio';

import {
  Category,
  IngredientForRecipeEdit,
  MealType,
  ParsedRecipe,
} from '@/types';

import { parseIngredients, parseInstructions } from '../../utils/parse';
import { getCategoryId } from './getCategory';
import { getMealType } from './getMealType';
import { getRecipeFromJsonLd } from './getRecipeFromJsonLd';
import { getRecipeImages } from './getRecipeImages';

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
  '[class*="ingredients"]', // for NYT Cooking
  '[data-testid="IngredientList"]', // for Bon Appetit
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
];

const findIngredientsOrInstructions = (
  $: cheerio.CheerioAPI,
  selector: string,
) => {
  const section = $(selector);
  const content: string[] = [];

  section.find('h1, h2, h3, h4, h5, h6, li').each((_, el) => {
    const text = $(el)
      .text()
      .replace(/[\s\t\n\r]+/g, ' ')
      .trim();
    console.log('🚀 ~ findIngredientsOrInstructions ~ text:', text, el.tagName);

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

export async function parseRecipeFromUrl(
  url: string,
  ingredients: IngredientForRecipeEdit[],
  categories: Category[],
  mealTypes: MealType[],
): Promise<ParsedRecipe> {
  const baseUrl = new URL(url).origin;

  // 1. Fetch HTML
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  // Check for JSON-LD structured data
  const toReturn = getRecipeFromJsonLd($, url, ingredients, categories);

  // Parse the HTML as a backup and for extra data
  if (!toReturn?.recipe.name) {
    // Assume recipe name is in the h1
    toReturn.recipe.name = $('h1').text().trim();
  }

  // Always find the ingredients since Recipe schema doesn't allow for sections
  const ingredientsParsed = parseIngredients(
    findIngredientsOrInstructions($, ingredientSelectors.join(', ')),
    ingredients,
  );
  if (ingredientsParsed.length > 0) {
    toReturn.ingredients = ingredientsParsed;
  }

  // Only do instructions if we don't have them from JSON-LD
  if (!toReturn?.recipe.instructions) {
    toReturn.recipe.instructions = parseInstructions(
      findIngredientsOrInstructions($, instructionCssSelectors.join(', ')),
    );
  }

  // Find the recipe images - JSON-LD might not give options or have any
  const htmlImageUrls = getRecipeImages($, toReturn.recipe.name, baseUrl);

  // Merge JSON-LD images with HTML-scraped images and deduplicate
  const allImageUrls = [...(toReturn.imageUrls ?? []), ...htmlImageUrls];
  const uniqueImageUrls = Array.from(new Set(allImageUrls));
  toReturn.imageUrls = uniqueImageUrls.length > 0 ? uniqueImageUrls : null;

  // Other info
  if (!toReturn?.recipe.servings) {
    const servings = $('.wprm-recipe-servings, .tasty-recipes-yield')
      .text()
      .trim();
    const servingsNumber = servings.match(/\d+/)?.[0] ?? null;
    toReturn.recipe.servings = servingsNumber
      ? parseInt(servingsNumber, 10)
      : null;
  }

  if (!toReturn?.recipe.categoryId) {
    toReturn.recipe.categoryId = getCategoryId(
      categories,
      toReturn.recipe.name,
    );
  }

  const mealTypeName = getMealType(
    toReturn.recipe.name,
    categories.find((c) => c.id === toReturn.recipe.categoryId)?.name ?? '',
  );
  if (mealTypeName) {
    toReturn.recipe.mealTypeId =
      mealTypes.find((m) => m.name === mealTypeName)?.id ?? null;
  }

  return toReturn;
}
