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

export function transformRecipe(recipe: RecipeDisplayDb): RecipeDisplay {
  return {
    name: recipe.name,
    made: recipe.made,
    imageUrl: recipe.image_url,
    sourceUrl: recipe.source_url,
    instructions: isValidInstructionSection(recipe.instructions)
      ? recipe.instructions
      : [],
    category: recipe.category?.name ?? null,
    rating: recipe.rating,
  };
}

export function transformRecipeForEdit(
  recipe: EditableRecipeDb,
): EditableRecipe {
  return {
    name: recipe.name,
    imageUrl: recipe.image_url,
    sourceUrl: recipe.source_url,
    instructions: isValidInstructionSection(recipe.instructions)
      ? recipe.instructions
      : [],
    categoryId: recipe.category_id,
  };
}

export function transformIngredientsForDisplay(
  ingredients: IngredientDisplayDb[],
): IngredientSections[] {
  const sortedIngredients = ingredients.sort((a, b) => a.position - b.position);

  return sortedIngredients.reduce(
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
}

export function transformIngredientsForEdit(
  ingredients: EditableIngredientDb[],
): IngredientSectionsEditable[] {
  const sortedIngredients = ingredients.sort((a, b) => a.position - b.position);

  return sortedIngredients.reduce(
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
}
