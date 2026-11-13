'use server';

import * as cheerio from 'cheerio';

import { getUser } from '@/lib/supabase/queries/user';
import {
  Category,
  Equipment,
  IngredientForRecipeEdit,
  MealType,
  ParsedRecipe,
} from '@/types';

import { parseIngredients, parseInstructions } from '../../utils/parse';
import { safeFetch } from '../../utils/safeFetch';
import { getCategoryId } from './getCategory';
import { getEquipmentIds } from './getEquipment';
import { findIngredientsOrInstructions } from './getIngredientsOrInstructions';
import { getMealType } from './getMealType';
import { findNotes } from './getNotes';
import { getRecipeFromJsonLd } from './getRecipeFromJsonLd';
import { getRecipeImages } from './getRecipeImages';

const TRACKING_PARAM_PREFIXES = ['utm_', 'mc_', 'pk_', 'hsa_', 'vero_'];
const TRACKING_PARAMS = new Set([
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'twclid',
  'ttclid',
  'igshid',
  'yclid',
  'mkt_tok',
  '_hsenc',
  '_hsmi',
  'ref',
  'ref_src',
  'si',
  'smid',
  'smtyp',
]);

function stripTrackingParams(urlObj: URL): string {
  const cleaned = new URL(urlObj.toString());

  for (const key of [...cleaned.searchParams.keys()]) {
    const lowerKey = key.toLowerCase();

    if (
      TRACKING_PARAMS.has(lowerKey) ||
      TRACKING_PARAM_PREFIXES.some((prefix) => lowerKey.startsWith(prefix))
    ) {
      cleaned.searchParams.delete(key);
    }
  }

  return cleaned.toString();
}

export async function parseRecipeFromUrl(
  url: string,
  ingredients: IngredientForRecipeEdit[],
  categories: Category[],
  mealTypes: MealType[],
  equipment: Equipment[] = [],
): Promise<ParsedRecipe> {
  if (!(await getUser())) {
    throw new Error('User not found');
  }

  let baseUrl: string;
  let fetchUrl: string;
  try {
    const parsedUrl = new URL(url);

    baseUrl = parsedUrl.origin;
    fetchUrl = stripTrackingParams(parsedUrl);
  } catch {
    throw new Error(`Invalid recipe URL: ${url}`);
  }

  // 1. Fetch HTML. safeFetch blocks private/internal addresses and enforces a
  // timeout and size limit so a hostile or hanging host can't abuse the action.
  let html: string;
  try {
    const response = await safeFetch(fetchUrl, {
      timeoutMs: 10000,
      headers: {
        // Some recipe sites reject requests without a browser-like User-Agent.
        'User-Agent':
          'Mozilla/5.0 (compatible; RecipeVault/1.0; +https://github.com)',
      },
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Failed to fetch recipe (${response.status})`);
    }

    html = response.body.toString('utf-8');
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timed out fetching recipe from ${url}`);
    }
    throw error;
  }

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
    findIngredientsOrInstructions($, 'ingredients'),
    ingredients,
  );
  if (ingredientsParsed.length > 0) {
    toReturn.ingredients = ingredientsParsed;
  }

  // Only do instructions if we don't have them from JSON-LD
  if (
    !toReturn?.recipe.instructions ||
    toReturn.recipe.instructions.length === 0
  ) {
    toReturn.recipe.instructions = parseInstructions(
      findIngredientsOrInstructions($, 'instructions'),
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

  toReturn.recipe.equipmentIds = getEquipmentIds(
    equipment,
    toReturn.recipe.instructions,
  );

  const notes = findNotes($);
  if (notes) {
    toReturn.recipe.notes = notes;
  }

  return toReturn;
}
