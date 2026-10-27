'use server';

import { revalidatePath } from 'next/cache';

import {
  addCategory as addCategoryQuery,
  updateCategory as updateCategoryQuery,
} from '@/lib/supabase/queries/categories';
import { getUser } from '@/lib/supabase/queries/user';
import { Category } from '@/types';

async function requireUser() {
  if (!(await getUser())) {
    throw new Error('User not found');
  }
}

export async function addCategory(name: string): Promise<Category | null> {
  await requireUser();
  const category = await addCategoryQuery(name);
  revalidatePath('/manage');
  return category;
}

export async function updateCategory(id: number, name: string) {
  await requireUser();
  await updateCategoryQuery({ id, name });
  revalidatePath('/manage');
}
