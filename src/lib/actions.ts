'use server';

import { redirect } from 'next/navigation';

import { createClient } from './supabase/server';

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
      ingredients: ingredients.split(/\r?\n/).filter(Boolean),
      instructions: instructions.split(/\r?\n/).filter(Boolean),
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

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error(error);
  }

  if (data.user) {
    redirect('/');
  }
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(error);
  }

  if (data.user) {
    redirect('/');
  }
}
