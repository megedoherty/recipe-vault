'use server';

import { revalidatePath } from 'next/cache';

import {
  addIngredient as addIngredientQuery,
  updateIngredient as updateIngredientQuery,
} from '@/lib/supabase/queries/ingredients';
import { IngredientDb } from '@/types';

import { requireAdmin } from './requireAdmin';

type IngredientInput = Omit<IngredientDb, 'id'>;

function clean(input: IngredientInput): IngredientInput {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Name is required');
  }
  return { ...input, name };
}

export async function addIngredient(
  input: IngredientInput,
): Promise<IngredientDb> {
  await requireAdmin();
  const ingredient = await addIngredientQuery(clean(input));
  revalidatePath('/manage');
  return ingredient;
}

export async function updateIngredient(id: string, input: IngredientInput) {
  await requireAdmin();
  await updateIngredientQuery(id, clean(input));
  revalidatePath('/manage');
}
