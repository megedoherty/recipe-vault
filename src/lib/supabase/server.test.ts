/** @jest-environment node */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { createClient } from './server';

jest.mock('@supabase/ssr', () => ({ createServerClient: jest.fn() }));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));

const cookieStore = { getAll: jest.fn(), set: jest.fn() };

beforeEach(() => {
  cookieStore.set.mockReset();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://supabase.test';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'key';
  (cookies as jest.Mock).mockResolvedValue(cookieStore);
});

const getCookieHandlers = async () => {
  await createClient();
  return (createServerClient as jest.Mock).mock.calls[0][2].cookies;
};

describe('createClient (server)', () => {
  it('creates a server client from the public env vars', async () => {
    const client = {};
    (createServerClient as jest.Mock).mockReturnValue(client);

    await expect(createClient()).resolves.toBe(client);
    expect(createServerClient).toHaveBeenCalledWith(
      'http://supabase.test',
      'key',
      expect.objectContaining({ cookies: expect.any(Object) }),
    );
  });

  it('creates a fresh client on every call', async () => {
    await createClient();
    await createClient();
    expect(createServerClient).toHaveBeenCalledTimes(2);
  });

  it('reads cookies from the Next cookie store', async () => {
    cookieStore.getAll.mockReturnValue([{ name: 'a', value: '1' }]);
    const handlers = await getCookieHandlers();
    expect(handlers.getAll()).toEqual([{ name: 'a', value: '1' }]);
  });

  it('writes cookies to the store', async () => {
    const handlers = await getCookieHandlers();
    handlers.setAll([{ name: 'a', value: '1', options: { path: '/' } }]);
    expect(cookieStore.set).toHaveBeenCalledWith('a', '1', { path: '/' });
  });

  it('ignores errors when cookies are set from a Server Component', async () => {
    cookieStore.set.mockImplementation(() => {
      throw new Error('read-only cookies');
    });
    const handlers = await getCookieHandlers();
    expect(() =>
      handlers.setAll([{ name: 'a', value: '1', options: {} }]),
    ).not.toThrow();
  });
});
