'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { RecipeIngredientDisplay } from '@/types';

interface ActionsResponse {
  success: boolean;
  error?: string;
}

/**
 * Builds shopping_list_item insert rows from selected recipe ingredients.
 */
function createShoppingListInsert(
  ingredients: RecipeIngredientDisplay[],
  recipeId: string | null,
  recipeName: string | null,
  userId: string,
) {
  return ingredients.map((ingredient) => ({
    user_id: userId,
    recipe_id: recipeId,
    recipe_name: recipeName,
    name: ingredient.name,
    quantity: ingredient.quantity,
    normalized_ingredient_id: ingredient.normalizedIngredientId,
    purchased: false,
  }));
}

/**
 * Adds selected recipe ingredients to the current user's shopping list.
 * One row is inserted per selected ingredient — no merge/dedupe at write time.
 */
export async function addToShoppingList(
  ingredients: RecipeIngredientDisplay[],
  recipeId: string | null,
  recipeName: string | null,
): Promise<ActionsResponse> {
  if (ingredients.length === 0) {
    return { success: false, error: 'No ingredients selected' };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const rows = createShoppingListInsert(
    ingredients,
    recipeId,
    recipeName,
    user.id,
  );

  const { error } = await supabase.from('shopping_list_item').insert(rows);

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  revalidatePath('/shopping-list');

  return { success: true };
}

/**
 * Marks all shopping list rows matching the given item IDs as purchased/unpurchased.
 * Called with a combined-view row's full sourceItemIds, so checking one combined
 * checkbox updates every underlying recipe-level row at once.
 */
export async function setPurchased(
  itemIds: string[],
  purchased: boolean,
): Promise<ActionsResponse> {
  if (itemIds.length === 0) {
    return { success: true };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const { error } = await supabase
    .from('shopping_list_item')
    .update({ purchased })
    .eq('user_id', user.id)
    .in('id', itemIds);

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  revalidatePath('/shopping-list');

  return { success: true };
}

/**
 * Removes shopping list rows by ID (e.g. removing a combined line from the view page).
 */
export async function removeFromShoppingList(
  itemIds: string[],
): Promise<ActionsResponse> {
  if (itemIds.length === 0) {
    return { success: true };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const { error } = await supabase
    .from('shopping_list_item')
    .delete()
    .eq('user_id', user.id)
    .in('id', itemIds);

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  revalidatePath('/shopping-list');

  return { success: true };
}

/**
 * Deletes every item on the current user's shopping list, purchased or not.
 */
export async function clearShoppingList(): Promise<ActionsResponse> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const { error } = await supabase
    .from('shopping_list_item')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  revalidatePath('/shopping-list');

  return { success: true };
}
