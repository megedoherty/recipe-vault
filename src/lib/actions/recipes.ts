'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { parseTextareaToArray } from '@/lib/utils/parse';
import { IngredientInsert, IngredientSections } from '@/types';

interface ActionsResponse {
  success: boolean;
  error?: string;
}

export async function addRecipe(
  ingredientSections: IngredientSections[],
  prevState: ActionsResponse | null,
  formData: FormData,
): Promise<ActionsResponse> {
  const rawFormData = Object.fromEntries(formData);
  const recipeName = rawFormData.name as string;
  const instructions = rawFormData.instructions as string;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const { data, error } = await supabase
    .from('recipe')
    .insert({
      user_id: user.id,
      name: recipeName,
      instructions: parseTextareaToArray(instructions),
    })
    .select('id')
    .single();

  if (error || !data || !data.id) {
    console.error(error);
    return {
      success: false,
      error: error?.message ?? 'Failed to create recipe',
    };
  }

  const ingredients: IngredientInsert[] = ingredientSections.flatMap(
    (section) =>
      section.ingredients.map((ingredient, index) => ({
        name: ingredient.name,
        quantity: ingredient.quantity,
        section: section.title,
        recipe_id: data.id,
        position: index,
      })),
  );

  const { error: ingredientError } = await supabase
    .from('ingredient')
    .insert(ingredients);

  if (ingredientError) {
    console.error(ingredientError);
    return {
      success: false,
      error: ingredientError?.message ?? 'Failed to create ingredients',
    };
  }

  redirect(`/recipes/${data.id}`);
}

export async function updateRecipe(
  recipeId: string,
  ingredientSections: IngredientSections[],
  prevState: ActionsResponse | null,
  formData: FormData,
): Promise<ActionsResponse> {
  const rawFormData = Object.fromEntries(formData);
  const name = rawFormData.name as string;
  const image_url = rawFormData.imageUrl as string;
  const source_url = rawFormData.sourceUrl as string;

  const instructions = formData
    .getAll('instruction')
    .flatMap((inst) => inst.toString().split(/\r?\n/))
    .map((inst) => inst.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe')
    .update({ name, instructions, image_url, source_url })
    .eq('id', recipeId)
    .select()
    .single();

  if (error || !data) {
    console.error(error);
    return { success: false, error: error.message };
  }

  const ingredients: IngredientInsert[] = ingredientSections.flatMap(
    (section) =>
      section.ingredients.map((ingredient, index) => ({
        id: ingredient.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        section: section.title,
        position: index,
      })),
  );

  const { error: ingredientError } = await supabase
    .from('ingredient')
    .upsert(ingredients);

  if (ingredientError) {
    console.error(ingredientError);
    return {
      success: false,
      error: ingredientError?.message ?? 'Failed to update ingredients',
    };
  }

  redirect(`/recipes/${data.id}`);
}

export async function toggleRecipeMade(
  recipeId: string,
  made: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe')
    .update({ made: made })
    .eq('id', recipeId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to toggle recipe made');
  }
}

export async function updateRecipeRating(
  recipeId: string,
  rating: number,
): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe')
    .update({ rating: rating })
    .eq('id', recipeId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to update recipe rating');
  }
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe')
    .delete()
    .eq('id', recipeId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to delete recipe');
  }

  redirect('/');
}
