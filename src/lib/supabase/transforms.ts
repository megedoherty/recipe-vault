import { storageLocations } from '@/constants';
import {
  EditableRecipe,
  EditableRecipeDb,
  InstructionSection,
  isStorageLocation,
  RecipeDisplay,
  RecipeDisplayDb,
  RecipeEditableIngredientDb,
  RecipeIngredientDisplayDb,
  RecipeIngredientSections,
  RecipeIngredientSectionsEditable,
  Step,
  StorageInfo,
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

function isValidStorage(data: unknown): data is StorageInfo[] {
  return Array.isArray(data) && data.every((item) => isValidStorageItem(item));
}

function isValidStorageItem(data: unknown): data is StorageInfo {
  return (
    typeof data === 'object' &&
    data !== null &&
    'location' in data &&
    'days' in data &&
    typeof data.location === 'string' &&
    isStorageLocation(data.location)
  );
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

  const storage: StorageInfo[] = isValidStorage(recipe.storage)
    ? recipe.storage.sort(
        sortByOrder(storageLocations, (info) => info.location),
      )
    : [];

  return {
    name: recipe.name,
    made: recipe.made,
    imageUrl: recipe.image_url,
    sourceUrl: recipe.source_url,
    instructions,
    category: recipe.category?.name ?? null,
    rating: recipe.rating,
    equipment: recipe.recipe_equipment.map((e) => e.equipment.name),
    servings: recipe.servings,
    storage,
    notes: recipe.notes,
    mealType: recipe.meal_type?.name ?? null,
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

  const storage: StorageInfo[] = isValidStorage(recipe.storage)
    ? recipe.storage
    : [];

  for (const location of storageLocations) {
    if (!storage.some((info) => info.location === location)) {
      storage.push({ location, days: null });
    }
  }

  return {
    name: recipe.name,
    imageUrl: recipe.image_url,
    sourceUrl: recipe.source_url,
    instructions,
    categoryId: recipe.category_id,
    equipmentIds: recipe.recipe_equipment.map((e) => e.equipment_id.toString()),
    servings: recipe.servings,
    storage: isValidStorage(recipe.storage) ? recipe.storage : [],
    notes: recipe.notes,
    mealTypeId: recipe.meal_type_id,
  };
}

export function transformIngredientsForDisplay(
  ingredients: RecipeIngredientDisplayDb[],
  sectionOrder: Json | null = null,
): RecipeIngredientSections[] {
  const validSectionOrder = isValidIngredientSectionOrder(sectionOrder)
    ? sectionOrder
    : null;
  const sortedIngredients = ingredients.sort((a, b) => a.position - b.position);

  const sections = sortedIngredients.reduce(
    (
      acc: RecipeIngredientSections[],
      ingredient: RecipeIngredientDisplayDb,
    ) => {
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
  ingredients: RecipeEditableIngredientDb[],
  sectionOrder: Json | null = null,
): RecipeIngredientSectionsEditable[] {
  const validSectionOrder = isValidIngredientSectionOrder(sectionOrder)
    ? sectionOrder
    : null;
  const sortedIngredients = ingredients.sort((a, b) => a.position - b.position);

  const sections = sortedIngredients.reduce(
    (
      acc: RecipeIngredientSectionsEditable[],
      ingredient: RecipeEditableIngredientDb,
    ) => {
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
