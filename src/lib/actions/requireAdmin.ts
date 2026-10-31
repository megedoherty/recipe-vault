import { getUser, isAdmin } from '@/lib/supabase/queries/user';

export async function requireAdmin() {
  if (!isAdmin(await getUser())) {
    throw new Error('Admin access required');
  }
}
