'use server';

import { revalidatePath } from 'next/cache';

import {
  addCategory as addCategoryQuery,
  updateCategory as updateCategoryQuery,
} from '@/lib/supabase/queries/categories';
import { Category } from '@/types';

import { requireAdmin } from './requireAdmin';

export async function addCategory(name: string): Promise<Category | null> {
  await requireAdmin();
  const category = await addCategoryQuery(name.trim());
  revalidatePath('/manage');
  return category;
}

export async function updateCategory(id: number, name: string) {
  await requireAdmin();
  await updateCategoryQuery({ id, name: name.trim() });
  revalidatePath('/manage');
}
