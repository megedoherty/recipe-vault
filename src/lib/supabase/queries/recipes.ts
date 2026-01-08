import {
  EditableRecipe,
  IngredientSections,
  IngredientSectionsEditable,
  RecipeDisplay,
  RecipeSummary,
} from '@/types';

import { createClient } from '../server';
import {
  transformIngredientsForDisplay,
  transformIngredientsForEdit,
  transformRecipe,
  transformRecipeForEdit,
} from '../transforms';

export async function getRecipeForDisplay(
  id: string,
): Promise<RecipeDisplay | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('recipe')
    .select(
      'image_url, instructions, name, made, rating, source_url, category(name), instruction_section_order',
    )
    .eq('id', id)
    .single();

  return data ? transformRecipe(data) : null;
}

export async function getRecipeForEdit(
  id: string,
): Promise<EditableRecipe | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('recipe')
    .select(
      'name, image_url, source_url, instructions, category_id, ingredient_section_order, instruction_section_order',
    )
    .eq('id', id)
    .single();
  return data ? transformRecipeForEdit(data) : null;
}

export async function getRecipeIngredientsForDisplay(
  id: string,
): Promise<IngredientSections[]> {
  const supabase = await createClient();

  // Get ingredients
  const { data: ingredients } = await supabase
    .from('recipe_ingredient')
    .select('id, name, quantity, position, section')
    .eq('recipe_id', id);

  // Get section order from recipe
  const { data: recipe } = await supabase
    .from('recipe')
    .select('ingredient_section_order')
    .eq('id', id)
    .single();

  return ingredients
    ? transformIngredientsForDisplay(
        ingredients,
        recipe?.ingredient_section_order,
      )
    : [];
}

export async function getRecipeIngredientsForEdit(
  id: string,
): Promise<IngredientSectionsEditable[]> {
  const supabase = await createClient();

  // Get ingredients
  const { data: ingredients } = await supabase
    .from('recipe_ingredient')
    .select('id, name, quantity, position, section, ingredient_id')
    .eq('recipe_id', id);

  // Get section order from recipe
  const { data: recipe } = await supabase
    .from('recipe')
    .select('ingredient_section_order')
    .eq('id', id)
    .single();

  return ingredients
    ? transformIngredientsForEdit(ingredients, recipe?.ingredient_section_order)
    : [];
}

interface GetAllRecipesParams {
  name?: string;
  categoryId?: number;
  includedIngredients?: string;
  excludedIngredients?: string;
}

export async function getAllRecipes({
  name,
  categoryId,
  includedIngredients,
  excludedIngredients,
}: GetAllRecipesParams = {}): Promise<RecipeSummary[]> {
  const supabase = await createClient();
  let query = supabase
    .from('recipe')
    .select('id, name, image_url, rating, made');

  if (name) {
    query = query.ilike('name', `%${name}%`);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  let includedRecipeIds: string[] = [];
  if (includedIngredients && includedIngredients.length > 0) {
    // Convert string IDs to numbers (ingredient_catalog uses number IDs)
    const ingredientIds = includedIngredients
      .split(',')
      .map((id) => parseInt(id, 10));

    // Get all ingredients that match the selected ingredient catalog IDs
    const { data: ingredients } = await supabase
      .from('recipe_ingredient')
      .select('recipe_id, ingredient_id')
      .in('ingredient_id', ingredientIds)
      .not('recipe_id', 'is', null)
      .overrideTypes<Array<{ recipe_id: string; ingredient_id: number }>>();

    if (ingredients && ingredients.length > 0) {
      // Group by recipe_id and count unique ingredients per recipe in set
      const recipeToIngredients = ingredients.reduce(
        (acc, ing) => {
          if (!acc[ing.recipe_id]) {
            acc[ing.recipe_id] = new Set();
          }
          acc[ing.recipe_id].add(ing.ingredient_id);
          return acc;
        },
        {} as Record<string, Set<number>>,
      );

      // Filter to recipes that have ALL selected ingredients
      const recipeIds = Object.entries(recipeToIngredients)
        .filter(
          ([, ingredientSet]) => ingredientSet.size === ingredientIds.length,
        )
        .map(([recipeId]) => recipeId);

      if (recipeIds.length > 0) {
        includedRecipeIds = recipeIds;
      } else {
        // No recipes have all the ingredients, return empty
        return [];
      }
    } else {
      // No ingredients found, return empty
      return [];
    }
  }

  let excludedRecipeIds: string[] = [];
  if (excludedIngredients && excludedIngredients.length > 0) {
    const excludedIngredientIds = excludedIngredients
      .split(',')
      .map((id) => parseInt(id, 10));

    const { data: excludedRecipes } = await supabase
      .from('recipe_ingredient')
      .select('recipe_id')
      .in('ingredient_id', excludedIngredientIds)
      .not('recipe_id', 'is', null)
      .overrideTypes<Array<{ recipe_id: string }>>();

    if (excludedRecipes && excludedRecipes.length > 0) {
      const recipeIds = [...new Set(excludedRecipes.map((r) => r.recipe_id))];
      excludedRecipeIds = recipeIds;
    }
  }

  let finalRecipeIds: string[] | undefined;
  if (includedRecipeIds.length > 0) {
    // Filter out any recipes that have excluded ingredients
    finalRecipeIds = includedRecipeIds.filter(
      (id) => !excludedRecipeIds.includes(id),
    );
  } else if (excludedRecipeIds.length > 0) {
    // No included ingredients, but we need to exclude some
    // We'll handle this with a query filter instead
    finalRecipeIds = undefined;
    query = query.not('id', 'in', `(${excludedRecipeIds.join(',')})`);
  }

  if (finalRecipeIds !== undefined) {
    if (finalRecipeIds.length > 0) {
      query = query.in('id', finalRecipeIds);
    } else {
      // No recipes match after filtering, return empty
      return [];
    }
  }

  const { data } = await query;

  return data
    ? data.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        imageUrl: recipe.image_url,
        rating: recipe.rating,
        made: recipe.made,
      }))
    : [];
}
