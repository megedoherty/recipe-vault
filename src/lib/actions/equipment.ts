'use server';

import { revalidatePath } from 'next/cache';

import {
  addEquipment as addEquipmentQuery,
  updateEquipment as updateEquipmentQuery,
} from '@/lib/supabase/queries/equipment';
import { Category } from '@/types';

import { requireAdmin } from './requireAdmin';

export async function addEquipment(name: string): Promise<Category | null> {
  await requireAdmin();
  const equipment = await addEquipmentQuery(name.trim());
  revalidatePath('/manage');
  return equipment;
}

export async function updateEquipment(id: number, name: string) {
  await requireAdmin();
  await updateEquipmentQuery(id, name.trim());
  revalidatePath('/manage');
}
