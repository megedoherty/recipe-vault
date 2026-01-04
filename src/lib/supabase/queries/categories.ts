import { Category } from '@/types';

import { createClient } from '../server';

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('category')
    .select('*')
    .order('name', { ascending: true });

  return data || [];
}

export async function updateCategory(category: Category) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('category')
    .update(category)
    .eq('id', category.id);

  if (error) {
    console.error(error);

    // throw error to revert the optimistic update
    throw error;
  }
}

export async function addCategory(name: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('category')
    .insert({ name })
    .select()
    .single();

  if (error || !data) {
    console.error(error);

    // throw error to revert the optimistic update
    throw error;
  }

  return data;
}

export async function deleteCategory(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from('category').delete().eq('id', id);

  if (error) {
    console.error(error);
  }
}
