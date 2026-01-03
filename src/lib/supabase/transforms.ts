import { Ingredient, IngredientSections, Recipe, RecipeDb } from '@/types';

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

export function transformRecipe(recipe: RecipeDb): Recipe {
  const instructions = isStringArray(recipe.instructions)
    ? recipe.instructions
    : [];

  return {
    id: recipe.id,
    name: recipe.name,
    createdAt: recipe.created_at,
    made: recipe.made,
    imageUrl: recipe.image_url,
    sourceUrl: recipe.source_url,
    instructions,
    rating: recipe.rating,
  };
}

export function transformIngredients(
  ingredients: Ingredient[],
): IngredientSections[] {
  return ingredients.reduce(
    (acc: IngredientSections[], ingredient: Ingredient) => {
      const section = acc.find(
        (section) => section.title === ingredient.section,
      );
      if (section) {
        section.ingredients.push(ingredient);
      } else {
        acc.push({
          title: ingredient.section,
          ingredients: [ingredient],
        });
      }
      return acc;
    },
    [],
  );
}
