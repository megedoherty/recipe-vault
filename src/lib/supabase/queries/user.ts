import { User } from '@supabase/supabase-js';

import { createClient } from '../server';

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return data ? data.user : null;
}
