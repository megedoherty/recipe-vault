/** @jest-environment node */
import { getUser } from '@/lib/supabase/queries/user';

import { requireAdmin } from './requireAdmin';

jest.mock('@/lib/supabase/queries/user', () => ({
  ...jest.requireActual('@/lib/supabase/queries/user'),
  getUser: jest.fn(),
}));

const mockGetUser = getUser as jest.Mock;

describe('requireAdmin', () => {
  it('resolves for an admin', async () => {
    mockGetUser.mockResolvedValue({
      id: 'u1',
      app_metadata: { role: 'admin' },
    });
    await expect(requireAdmin()).resolves.toBeUndefined();
  });

  it('throws for a regular user', async () => {
    mockGetUser.mockResolvedValue({ id: 'u1', app_metadata: {} });
    await expect(requireAdmin()).rejects.toThrow('Admin access required');
  });

  it('throws when signed out', async () => {
    mockGetUser.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow('Admin access required');
  });
});
