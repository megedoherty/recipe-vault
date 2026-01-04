'use server';

import { revalidatePath } from 'next/cache';

import {
  addCategory as addCategoryQuery,
  updateCategory as updateCategoryQuery,
} from '@/lib/supabase/queries/categories';
import { Category } from '@/types';

export async function addCategory(name: string): Promise<Category | null> {
  const category = await addCategoryQuery(name);
  revalidatePath('/manage');
  return category;
}

export async function updateCategory(id: number, name: string) {
  await updateCategoryQuery({ id, name });
  revalidatePath('/manage');
}
