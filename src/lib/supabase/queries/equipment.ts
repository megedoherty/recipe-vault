import { Equipment } from '@/types';

import { createClient } from '../server';

export async function getEquipment(): Promise<Equipment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('equipment')
    .select('*')
    .order('name', { ascending: true });

  return (
    data?.map((equipment) => ({
      id: equipment.id.toString(),
      name: equipment.name,
    })) || []
  );
}

export async function addEquipment(
  name: string,
): Promise<{ id: number; name: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('equipment')
    .insert({ name })
    .select()
    .single();

  if (error || !data) {
    console.error(error);
    throw error;
  }

  return data;
}

export async function updateEquipment(id: number, name: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('equipment')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error(error);
    throw error;
  }
}
