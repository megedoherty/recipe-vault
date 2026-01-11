import { Occasion } from '@/types';

import { createClient } from '../server';

export async function getOccasions(): Promise<Occasion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('occasion')
    .select('*')
    .order('name', { ascending: true });

  return data || [];
}
