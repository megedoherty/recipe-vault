import { IngredientSections, Recipe, RecipeCardInfo } from '@/types';

import { createClient } from '../server';
import { transformIngredients, transformRecipe } from '../transforms';

export async function getRecipe(id: string): Promise<Recipe | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('recipe')
    .select('*, category(*)')
    .eq('id', id)
    .single();

  return data ? transformRecipe(data) : null;
}

export async function getRecipeIngredients(
  id: string,
): Promise<IngredientSections[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ingredient')
    .select('id, name, quantity, position, section, position')
    .eq('recipe_id', id);
  return data ? transformIngredients(data) : [];
}

interface GetAllRecipesParams {
  name?: string;
  categoryId?: number;
}

export async function getAllRecipes({
  name,
  categoryId,
}: GetAllRecipesParams = {}): Promise<RecipeCardInfo[]> {
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
