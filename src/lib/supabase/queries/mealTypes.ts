import { MealType } from '@/types';

import { createClient } from '../server';

export async function getMealTypes(): Promise<MealType[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('meal_type')
    .select('*')
    .order('name', { ascending: true });

  return data || [];
}
