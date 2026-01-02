'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { parseTextareaToArray } from '@/lib/utils/parse';
import { IngredientInsert } from '@/types';

import { DEFAULT_SECTION_NAME } from '../utils/constants';

interface ActionsResponse {
  success: boolean;
  error?: string;
}

const sectionIngredientRegex = /^section-(.+?)-ingredient-(\d+)$/;
const SECTION_NAME = 1;
const POSITION = 2;

export async function addRecipe(
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

  // Process all the ingredients and insert them
  const recipe_id = data.id;
  const ingredients: IngredientInsert[] = [];

  for (const [key, value] of Object.entries(rawFormData)) {
    if (!value || value.toString().trim() === '') continue;

    const match = key.match(sectionIngredientRegex);
    if (match) {
      const quantity = rawFormData[
        key.replace('ingredient', 'quantity')
      ] as string;
      const section =
        match[SECTION_NAME] === DEFAULT_SECTION_NAME
          ? null
          : match[SECTION_NAME];

      ingredients.push({
        name: value as string,
        position: Number(match[POSITION]),
        quantity,
        recipe_id,
        section,
      });
    }
  }

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
  prevState: ActionsResponse | null,
  formData: FormData,
): Promise<ActionsResponse> {
  const rawFormData = Object.fromEntries(formData);
  const name = rawFormData.name as string;
  const image_url = rawFormData.imageUrl as string;
  const source_url = rawFormData.sourceUrl as string;

  const ingredients = formData
    .getAll('ingredient')
    .map((ing) => ing.toString().trim())
    .filter(Boolean);

  const instructions = formData
    .getAll('instruction')
    .flatMap((inst) => inst.toString().split(/\r?\n/))
    .map((inst) => inst.trim())
    .filter(Boolean);

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
