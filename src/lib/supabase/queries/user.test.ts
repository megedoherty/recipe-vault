import type { User } from '@supabase/supabase-js';

import { createSupabaseMock } from '@/lib/actions/testUtils';

import { createClient } from '../server';
import { canModifyRecipe, getUser, isAdmin, isUserLoggedIn } from './user';

jest.mock('../server', () => ({ createClient: jest.fn() }));

const makeUser = (overrides: Partial<User> = {}): User =>
  ({ id: 'u1', app_metadata: {}, ...overrides }) as User;

describe('getUser', () => {
  it('returns the signed-in user', async () => {
    const user = makeUser();
    (createClient as jest.Mock).mockResolvedValue(createSupabaseMock({ user }));
    await expect(getUser()).resolves.toEqual(user);
  });

  it('returns null when signed out', async () => {
    (createClient as jest.Mock).mockResolvedValue(createSupabaseMock());
    await expect(getUser()).resolves.toBeNull();
  });

  it('returns null when there is no data', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.getUser.mockResolvedValue({ data: null });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(getUser()).resolves.toBeNull();
  });
});

describe('isUserLoggedIn', () => {
  it('is true when claims exist', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      createSupabaseMock({ claims: { sub: 'u1' } }),
    );
    await expect(isUserLoggedIn()).resolves.toBe(true);
  });

  it('is false without claims', async () => {
    (createClient as jest.Mock).mockResolvedValue(createSupabaseMock());
    await expect(isUserLoggedIn()).resolves.toBe(false);
  });
});

describe('isAdmin', () => {
  it('is true only for the admin role', () => {
    expect(isAdmin(makeUser({ app_metadata: { role: 'admin' } }))).toBe(true);
    expect(isAdmin(makeUser({ app_metadata: { role: 'editor' } }))).toBe(false);
    expect(isAdmin(makeUser())).toBe(false);
  });

  it('is false for no user or missing app_metadata', () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin({ id: 'u1' } as User)).toBe(false);
  });
});

describe('canModifyRecipe', () => {
  it('allows the owner', () => {
    expect(canModifyRecipe(makeUser(), 'u1')).toBe(true);
  });

  it("allows an admin on someone else's recipe", () => {
    const admin = makeUser({ app_metadata: { role: 'admin' } });
    expect(canModifyRecipe(admin, 'other')).toBe(true);
    expect(canModifyRecipe(admin, null)).toBe(true);
  });

  it('denies other users and unowned recipes', () => {
    expect(canModifyRecipe(makeUser(), 'other')).toBe(false);
    expect(canModifyRecipe(makeUser(), null)).toBe(false);
  });

  it('denies signed-out visitors', () => {
    expect(canModifyRecipe(null, 'u1')).toBe(false);
    expect(canModifyRecipe(null, null)).toBe(false);
  });
});
