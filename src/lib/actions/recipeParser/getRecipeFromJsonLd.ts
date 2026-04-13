import * as cheerio from 'cheerio';
import { decode } from 'he';

import { defaultStorage } from '@/constants';
import { parseIngredients, parseInstructions } from '@/lib/utils/parse';
import { Category, IngredientForRecipeEdit, ParsedRecipe } from '@/types';

import { getCategoryId } from './getCategory';
import { getImageBaseFilename, getImageQuality } from './getRecipeImages';

type JsonLdPrimitive = string | number | boolean | null;

export type JsonLdValue = JsonLdPrimitive | JsonLdObject | JsonLdValue[];

export interface JsonLdObject {
  [key: string]: JsonLdValue | undefined;
  '@type'?: string | string[];
  '@graph'?: JsonLdValue;
}

export interface ImageObject extends JsonLdObject {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
}

function isImageObject(obj: unknown): obj is ImageObject {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '@type' in obj &&
    obj['@type'] === 'ImageObject'
  );
}

export interface HowToStep extends JsonLdObject {
  '@type': 'HowToStep';
  text: string;
  name?: string;
  url?: string;
}

export interface HowToSection extends JsonLdObject {
  '@type': 'HowToSection';
  name: string;
  itemListElement: HowToStep[];
}

export type RecipeInstructions =
  | string
  | HowToStep
  | HowToSection
  | Array<string | HowToStep | HowToSection>;

export interface Recipe extends JsonLdObject {
  '@type': 'Recipe';
  name: string;
  image?: string | string[] | ImageObject | ImageObject[];
  keywords?: string | string[];
  // Ingredients & instructions
  recipeIngredient?: string[];
  recipeInstructions?: RecipeInstructions;
  // Yield & serving
  recipeYield?: string | string[];
  // Classification
  recipeCategory?: string | string[];
}

const isRecipeJsonLdObject = (obj: JsonLdObject): obj is Recipe => {
  return (
    (typeof obj['@type'] === 'string' && obj['@type'] === 'Recipe') ||
    (Array.isArray(obj['@type']) && obj['@type'].includes('Recipe'))
  );
};

export const getRecipeFromJsonLd = (
  $: cheerio.CheerioAPI,
  sourceUrl: string,
  ingredients: IngredientForRecipeEdit[],
  categories: Category[],
): ParsedRecipe => {
  const jsonLd = extractJsonLd($);
  for (const entity of jsonLd) {
    if (isRecipeJsonLdObject(entity)) {
      const images = getImages(entity);

      let categoryId = null;

      // Test recipe name, keywords, and recipeCategory
      if (entity.name) {
        categoryId = getCategoryId(categories, entity.name);
      }
      if (!categoryId && entity.keywords) {
        categoryId = getCategoryId(
          categories,
          Array.isArray(entity.keywords)
            ? entity.keywords.join(' ')
            : entity.keywords,
        );
      }
      if (!categoryId && entity.recipeCategory) {
        categoryId = getCategoryId(
          categories,
          Array.isArray(entity.recipeCategory)
            ? entity.recipeCategory.join(' ')
            : entity.recipeCategory,
        );
      }

      return {
        recipe: {
          name: entity.name,
          instructions: parseInstructions(getInstructions(entity)),
          sourceUrl,
          imageUrl: images[0] ?? null,
          servings: getRecipeServings(entity),
          categoryId,
          // TODO
          equipmentIds: [], // TODO
          storage: defaultStorage,
          notes: null, // TODO
          mealTypeId: null, // TODO
          occasionId: null, // TODO
        },
        ingredients: parseIngredients(
          entity.recipeIngredient?.join('\n') ?? undefined,
          ingredients,
        ),
        imageUrls: images,
      } as ParsedRecipe;
    }
  }

  // Return default object and HTML parsing will be used as fallback
  return {
    recipe: {
      name: '',
      instructions: [],
      sourceUrl: null,
      imageUrl: null,
      servings: null,
      categoryId: null,
      equipmentIds: [],
      storage: defaultStorage,
      notes: null,
      mealTypeId: null,
      occasionId: null,
    },
    ingredients: [],
    imageUrls: null,
  } as ParsedRecipe;
};

function extractJsonLd($: cheerio.CheerioAPI) {
  const entities: JsonLdObject[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;

    let parsed: JsonLdValue;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return; // skip invalid JSON-LD
    }

    normalize(parsed, entities);
  });

  return entities;
}

function normalize(node: unknown, result: JsonLdObject[]): void {
  if (node == null) return;

  // Root array
  if (Array.isArray(node)) {
    for (const item of node) {
      normalize(item, result);
    }
    return;
  }

  // Must be an object from here on
  if (typeof node !== 'object') return;

  const obj = node as JsonLdObject;

  // @graph container
  if (obj['@graph']) {
    normalize(obj['@graph'], result);
    return;
  }

  // Entity node
  result.push(obj);
}

function getInstructions(entity: Recipe): string {
  const instructions = entity.recipeInstructions;

  if (!instructions) return '';

  if (typeof instructions === 'string') {
    return instructions;
  }

  let result = '';

  // Handle array of instructions
  if (Array.isArray(instructions)) {
    for (const item of instructions) {
      const itemText = getInstructionText(item);
      if (itemText) {
        result += (result ? '\n\n' : '') + itemText;
      }
    }
    return result;
  }

  // Handle single HowToStep or HowToSection
  return getInstructionText(instructions);
}

function getInstructionText(
  instruction: string | HowToStep | HowToSection,
): string {
  if (typeof instruction === 'string') {
    return decode(instruction) || '';
  }

  // Handle HowToStep
  if (instruction['@type'] === 'HowToStep') {
    return decode(instruction.text) || '';
  }

  // Handle HowToSection
  if (instruction['@type'] === 'HowToSection') {
    const sectionName = instruction.name || '';
    let sectionText =
      `${sectionName}${sectionName.endsWith(':') ? '' : ':'}` || '';
    const steps: string[] = [];

    for (const step of instruction.itemListElement || []) {
      const stepText = getInstructionText(step);
      if (stepText) {
        steps.push(stepText);
      }
    }

    if (steps.length > 0) {
      sectionText += (sectionText ? '\n' : '') + steps.join('\n');
    }

    return sectionText;
  }

  return '';
}

function getImages(entity: Recipe): string[] {
  const images = entity.image;

  if (!images) return [];

  // Collect all URLs with their quality info
  const imageUrls: Array<{ url: string; quality: number }> = [];

  if (typeof images === 'string') {
    imageUrls.push({ url: images, quality: getImageQuality(images) });
  } else if (
    Array.isArray(images) &&
    images.every((item) => typeof item === 'string')
  ) {
    imageUrls.push(
      ...images.map((url) => ({ url, quality: getImageQuality(url) })),
    );
  } else if (isImageObject(images)) {
    imageUrls.push({
      url: images.url,
      quality: getImageQuality(images.url, images.width, images.height),
    });
  } else if (Array.isArray(images)) {
    // Array of ImageObjects
    imageUrls.push(
      ...images.map((image) => ({
        url: image.url,
        quality: getImageQuality(image.url, image.width, image.height),
      })),
    );
  }

  // Deduplicate by base filename, keeping highest quality
  const imageMap: Record<string, { url: string; quality: number }> = {};

  imageUrls.forEach(({ url, quality }) => {
    const baseFilename = getImageBaseFilename(url);
    const existing = imageMap[baseFilename];
    if (!existing || quality > existing.quality) {
      imageMap[baseFilename] = { url, quality };
    }
  });

  return Object.values(imageMap).map((item) => item.url);
}

function getRecipeServings(entity: Recipe): string | null {
  const servings = entity.recipeYield;

  if (!servings) return null;

  if (typeof servings === 'string') {
    return servings.match(/\d+/)?.[0] ?? null;
  }

  if (typeof servings === 'number') {
    return servings;
  }

  for (const serving of servings) {
    if (typeof serving === 'string') {
      return serving.match(/\d+/)?.[0] ?? null;
    }
  }

  return null;
}
