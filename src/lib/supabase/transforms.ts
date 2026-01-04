import {
  Ingredient,
  IngredientSections,
  InstructionSection,
  Recipe,
  RecipeDbWithCategory,
} from '@/types';

export function transformRecipe(recipe: RecipeDbWithCategory): Recipe {
  return {
    id: recipe.id,
    name: recipe.name,
    createdAt: recipe.created_at,
    made: recipe.made,
    imageUrl: recipe.image_url,
    sourceUrl: recipe.source_url,
    instructions: recipe.instructions as unknown as InstructionSection[],
    category: recipe.category ?? undefined,
    rating: recipe.rating,
  };
}

export function transformIngredients(
  ingredients: Ingredient[],
): IngredientSections[] {
  const sortedIngredients = ingredients.sort((a, b) => a.position - b.position);

  return sortedIngredients.reduce(
    (acc: IngredientSections[], ingredient: Ingredient) => {
      const section = acc.find(
        (section) => section.title === ingredient.section,
      );
      if (section) {
        section.ingredients.push(ingredient);
      } else {
        acc.push({
          id: crypto.randomUUID(), // used for key in the UI
          title: ingredient.section,
          ingredients: [ingredient],
        });
      }
      return acc;
    },
    [],
  );
}
