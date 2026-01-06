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
      'image_url, instructions, name, made, rating, source_url, category(name)',
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
    .select('name, image_url, source_url, instructions, category_id')
    .eq('id', id)
    .single();
  return data ? transformRecipeForEdit(data) : null;
}

export async function getRecipeIngredientsForDisplay(
  id: string,
): Promise<IngredientSections[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ingredient')
    .select('id, name, quantity, position, section')
    .eq('recipe_id', id);
  return data ? transformIngredientsForDisplay(data) : [];
}

export async function getRecipeIngredientsForEdit(
  id: string,
): Promise<IngredientSectionsEditable[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ingredient')
    .select('id, name, quantity, position, section, ingredient_id')
    .eq('recipe_id', id);
  return data ? transformIngredientsForEdit(data) : [];
}

interface GetAllRecipesParams {
  name?: string;
  categoryId?: number;
}

export async function getAllRecipes({
  name,
  categoryId,
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
