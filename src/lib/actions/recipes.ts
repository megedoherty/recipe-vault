'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { parseTextareaToArray } from '@/lib/utils/parse';
import { IngredientInsert, IngredientSections } from '@/types';

interface ActionsResponse {
  success: boolean;
  error?: string;
}

/**
 * Creates the ingredients insert object for the recipe based on the FE sections object.
 */
const createIngredientsInsert = (
  ingredientSections: IngredientSections[],
  recipeId: string,
) => {
  return ingredientSections
    .flatMap((section) =>
      section.ingredients.map((ingredient, index) => ({
        name: ingredient.name,
        quantity: ingredient.quantity,
        section: section.title,
        recipe_id: recipeId,
        position: index,
      })),
    )
    .filter((ingredient) => ingredient.name.trim() !== '');
};

/**
 * Add a new recipe to the database.
 *
 * Inserts the recipe info into the recipe table.
 * Inserts the ingredients into the ingredient table with the new recipe ID.
 */
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

  const ingredients: IngredientInsert[] = createIngredientsInsert(
    ingredientSections,
    data.id,
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

/**
 * Update a recipe in the database.
 *
 * Updates the recipe info in the recipe table.
 * Updates/inserts the ingredients in the ingredient table with the new recipe ID.
 * Deletes any ingredients that are no longer in the FE sections object.
 */
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
  const { data: recipeData, error } = await supabase
    .from('recipe')
    .update({ name, instructions, image_url, source_url })
    .eq('id', recipeId)
    .select()
    .single();

  if (error || !recipeData) {
    console.error(error);
    return { success: false, error: error.message };
  }

  // Check if we need to delete any ingredients
  const { data: currentIngredientIds } = await supabase
    .from('ingredient')
    .select('id')
    .eq('recipe_id', recipeId);

  const ingredients: IngredientInsert[] = createIngredientsInsert(
    ingredientSections,
    recipeData.id,
  );

  if (currentIngredientIds) {
    const ingredientsToDelete = currentIngredientIds.filter(
      (ingredient) => !ingredients.some((i) => i.id === ingredient.id),
    );

    if (ingredientsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('ingredient')
        .delete()
        .in(
          'id',
          ingredientsToDelete.map((i) => i.id),
        );

      if (deleteError) {
        console.error(deleteError);
        return { success: false, error: deleteError.message };
      }
    }
  }

  // Update the rest of the ingredients
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

  redirect(`/recipes/${recipeData.id}`);
}

/**
 * Mark a recipe as made or not made.
 */
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

/**
 * Update the rating of a recipe.
 */
export async function updateRecipeRating(
  recipeId: string,
  rating: number,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('recipe')
    .update({ rating: rating })
    .eq('id', recipeId);

  if (error) {
    throw new Error(error?.message ?? 'Failed to update recipe rating');
  }
}

/**
 * Delete a recipe from the database.
 */
export async function deleteRecipe(recipeId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('recipe').delete().eq('id', recipeId);

  if (error) {
    throw new Error(error?.message ?? 'Failed to delete recipe');
  }

  redirect('/');
}
