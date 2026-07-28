import { ShoppingListItem } from '@/types';

import { createClient } from '../server';
import { transformShoppingListItems } from '../transforms';

export async function getShoppingListItems(): Promise<ShoppingListItem[]> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('shopping_list_item')
    .select(
      'id, recipe_id, recipe_name, name, quantity, normalized_ingredient_id, purchased, ingredient(name, category)',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error(error);
    return [];
  }

  return transformShoppingListItems(data);
}
