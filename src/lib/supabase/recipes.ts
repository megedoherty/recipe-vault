import { Recipe, RecipeCardInfo, RecipeDb } from '@/types';

import { createClient } from './server';

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function transformRecipe(recipe: RecipeDb): Recipe {
  const ingredients = isStringArray(recipe.ingredients)
    ? recipe.ingredients
    : [];
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
    ingredients,
    instructions,
    rating: recipe.rating,
  };
}

export async function getRecipe(id: number): Promise<Recipe | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('recipe')
    .select('*')
    .eq('id', id)
    .single();

  return data ? transformRecipe(data) : null;
}

export async function getAllRecipes(): Promise<RecipeCardInfo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('recipe')
    .select('id, name, image_url, rating, made');

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
