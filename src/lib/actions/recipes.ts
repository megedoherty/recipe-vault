'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { parseTextareaToArray } from '@/lib/utils';

interface ActionsResponse {
  success: boolean;
  error?: string;
}

export async function addRecipe(
  prevState: ActionsResponse | null,
  formData: FormData,
): Promise<ActionsResponse> {
  const rawFormData = Object.fromEntries(formData);
  const name = rawFormData.name as string;
  const ingredients = rawFormData.ingredients as string;
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
      name,
      ingredients: parseTextareaToArray(ingredients),
      instructions: parseTextareaToArray(instructions),
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error(error);
    return { success: false, error: error.message };
  }

  if (data && data.id) {
    redirect(`/recipes/${data.id}`);
  }

  return { success: false, error: 'Recipe created but could not retrieve ID' };
}

export async function updateRecipe(
  recipeId: number,
  prevState: ActionsResponse | null,
  formData: FormData,
): Promise<ActionsResponse> {
  const rawFormData = Object.fromEntries(formData);
  const name = rawFormData.name as string;
  const ingredients = parseTextareaToArray(rawFormData.ingredients as string);
  const instructions = parseTextareaToArray(rawFormData.instructions as string);
  const image_url = rawFormData.imageUrl as string;
  const source_url = rawFormData.sourceUrl as string;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe')
    .update({ name, ingredients, instructions, image_url, source_url })
    .eq('id', recipeId)
    .select()
    .single();

  if (error || !data) {
    console.error(error);
    return { success: false, error: error.message };
  }

  if (data && data.id) {
    redirect(`/recipes/${data.id}`);
  }

  return { success: false, error: 'Recipe updated but could not retrieve ID' };
}

export async function toggleRecipeMade(
  recipeId: number,
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
  recipeId: number,
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

export async function deleteRecipe(recipeId: number): Promise<void> {
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
