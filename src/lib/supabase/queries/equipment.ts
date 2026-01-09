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
