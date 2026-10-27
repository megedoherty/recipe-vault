import { User } from '@supabase/supabase-js';

import { createClient } from '../server';

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return data ? data.user : null;
}

export async function isUserLoggedIn(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return !!data?.claims;
}

/**
 * Admin status lives in app_metadata, which only the service role / dashboard
 * can write.
 */
export function isAdmin(user: User | null): boolean {
  return user?.app_metadata?.role === 'admin';
}

/** A recipe can be modified by its owner or by an admin. */
export function canModifyRecipe(
  user: User | null,
  recipeOwnerId: string | null,
): boolean {
  return !!user && (recipeOwnerId === user.id || isAdmin(user));
}
