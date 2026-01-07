import {
  EditableIngredientDb,
  EditableRecipe,
  EditableRecipeDb,
  IngredientDisplayDb,
  IngredientSections,
  IngredientSectionsEditable,
  InstructionSection,
  RecipeDisplay,
  RecipeDisplayDb,
  Step,
} from '@/types';

import { sortByOrder } from '../utils/sort';
import { Json } from './types';

function isValidInstructionSection(
  data: unknown,
): data is InstructionSection[] {
  return (
    Array.isArray(data) &&
    data.every((item) => isValidInstructionSectionItem(item))
  );
}

function isValidInstructionSectionItem(
  data: unknown,
): data is InstructionSection {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data &&
    'steps' in data &&
    Array.isArray(data.steps) &&
    data.steps.every((item) => isValidStepItem(item))
  );
}

function isValidStepItem(data: unknown): data is Step {
  return (
    typeof data === 'object' && data !== null && 'id' in data && 'text' in data
  );
}

function isValidInstructionSectionOrder(data: unknown): data is string[] {
  return Array.isArray(data) && data.every((item) => typeof item === 'string');
}

function isValidIngredientSectionOrder(data: unknown): data is string[] {
  return Array.isArray(data) && data.every((item) => typeof item === 'string');
}

export function transformRecipe(recipe: RecipeDisplayDb): RecipeDisplay {
  const rawInstructions = isValidInstructionSection(recipe.instructions)
    ? (recipe.instructions as InstructionSection[])
    : [];
  const rawInstructionSectionOrder = isValidInstructionSectionOrder(
    recipe.instruction_section_order,
  )
    ? (recipe.instruction_section_order as string[])
    : [];

  // If we have a stored instruction section order, use it to reorder sections
  const instructions: InstructionSection[] =
    rawInstructionSectionOrder.length > 0
      ? rawInstructions.sort(
          sortByOrder(rawInstructionSectionOrder, (section) => section.id),
        )
      : rawInstructions;

  return {
    name: recipe.name,
    made: recipe.made,
    imageUrl: recipe.image_url,
    sourceUrl: recipe.source_url,
    instructions,
    category: recipe.category?.name ?? null,
    rating: recipe.rating,
  };
}

export function transformRecipeForEdit(
  recipe: EditableRecipeDb,
): EditableRecipe {
  const rawInstructions = isValidInstructionSection(recipe.instructions)
    ? (recipe.instructions as InstructionSection[])
    : [];
  const rawInstructionSectionOrder = isValidInstructionSectionOrder(
    recipe.instruction_section_order,
  )
    ? (recipe.instruction_section_order as string[])
    : [];

  // If we have a stored instruction section order, use it to reorder sections
  const instructions: InstructionSection[] =
    rawInstructionSectionOrder.length > 0
      ? rawInstructions.sort(
          sortByOrder(rawInstructionSectionOrder, (section) => section.id),
        )
      : rawInstructions;

  return {
    name: recipe.name,
    imageUrl: recipe.image_url,
    sourceUrl: recipe.source_url,
    instructions,
    categoryId: recipe.category_id,
  };
}

export function transformIngredientsForDisplay(
  ingredients: IngredientDisplayDb[],
  sectionOrder: Json | null = null,
): IngredientSections[] {
  const validSectionOrder = isValidIngredientSectionOrder(sectionOrder)
    ? sectionOrder
    : null;
  const sortedIngredients = ingredients.sort((a, b) => a.position - b.position);

  const sections = sortedIngredients.reduce(
    (acc: IngredientSections[], ingredient: IngredientDisplayDb) => {
      const section = acc.find(
        (section) => section.title === ingredient.section,
      );

      const ingredientToAdd = {
        id: ingredient.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
      };
      if (section) {
        section.ingredients.push(ingredientToAdd);
      } else {
        acc.push({
          id: crypto.randomUUID(), // used for key in the UI
          title: ingredient.section,
          ingredients: [ingredientToAdd],
        });
      }
      return acc;
    },
    [],
  );

  // Sort by sectionOrder if available
  if (validSectionOrder && validSectionOrder.length > 0) {
    return sections.sort(
      sortByOrder(validSectionOrder, (section) => section.title),
    );
  }

  return sections;
}

export function transformIngredientsForEdit(
  ingredients: EditableIngredientDb[],
  sectionOrder: Json | null = null,
): IngredientSectionsEditable[] {
  const validSectionOrder = isValidIngredientSectionOrder(sectionOrder)
    ? sectionOrder
    : null;
  const sortedIngredients = ingredients.sort((a, b) => a.position - b.position);

  const sections = sortedIngredients.reduce(
    (acc: IngredientSectionsEditable[], ingredient: EditableIngredientDb) => {
      const section = acc.find(
        (section) => section.title === ingredient.section,
      );

      const ingredientToAdd = {
        id: ingredient.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        section: ingredient.section,
        ingredientId: ingredient.ingredient_id?.toString() ?? null,
      };

      if (section) {
        section.ingredients.push(ingredientToAdd);
      } else {
        acc.push({
          id: crypto.randomUUID(), // used for key in the UI
          title: ingredient.section,
          ingredients: [ingredientToAdd],
        });
      }

      return acc;
    },
    [],
  );

  // Sort by sectionOrder if available
  if (validSectionOrder && validSectionOrder.length > 0) {
    return sections.sort(
      sortByOrder(validSectionOrder, (section) => section.title),
    );
  }

  return sections;
}
