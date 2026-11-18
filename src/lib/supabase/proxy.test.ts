/** @jest-environment node */
import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';

import { updateSession } from './proxy';

jest.mock('@supabase/ssr', () => ({ createServerClient: jest.fn() }));

const getClaims = jest.fn();

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://supabase.test';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'key';
  getClaims.mockResolvedValue({ data: { claims: { sub: 'u1' } } });
  (createServerClient as jest.Mock).mockReturnValue({ auth: { getClaims } });
});

const request = (path: string) =>
  new NextRequest(new URL(path, 'http://localhost:3000'));

describe('updateSession', () => {
  describe('signed out', () => {
    beforeEach(() => {
      getClaims.mockResolvedValue({ data: { claims: null } });
    });

    it.each(['/recipes/1', '/shopping-list', '/loginish', '/authors'])(
      'redirects %s to /auth/login',
      async (path) => {
        const response = await updateSession(request(path));
        expect(response.status).toBe(307);
        expect(new URL(response.headers.get('location')!).pathname).toBe(
          '/auth/login',
        );
      },
    );

    it.each([
      '/',
      '/login',
      '/login/',
      '/auth',
      '/auth/login',
      '/auth/sign-up',
    ])('lets %s through', async (path) => {
      const response = await updateSession(request(path));
      expect(response.headers.get('location')).toBeNull();
      expect(response.status).toBe(200);
    });

    it('treats a missing data object as signed out', async () => {
      getClaims.mockResolvedValue({ data: null });
      const response = await updateSession(request('/recipes/1'));
      expect(response.status).toBe(307);
    });
  });

  describe('signed in', () => {
    it.each(['/', '/recipes/1', '/shopping-list'])(
      'lets %s through',
      async (path) => {
        const response = await updateSession(request(path));
        expect(response.headers.get('location')).toBeNull();
        expect(response.status).toBe(200);
      },
    );
  });

  it('creates a client with env config on every call', async () => {
    await updateSession(request('/'));
    await updateSession(request('/'));
    expect(createServerClient).toHaveBeenCalledTimes(2);
    expect(createServerClient).toHaveBeenCalledWith(
      'http://supabase.test',
      'key',
      expect.objectContaining({ cookies: expect.any(Object) }),
    );
  });

  it('reads cookies from the request', async () => {
    const req = request('/');
    req.cookies.set('a', '1');
    await updateSession(req);
    const { cookies } = (createServerClient as jest.Mock).mock.calls[0][2];
    expect(cookies.getAll()).toEqual([
      expect.objectContaining({ name: 'a', value: '1' }),
    ]);
  });

  it('copies refreshed cookies onto the returned response', async () => {
    let setAll: (c: unknown[]) => void = () => {};
    (createServerClient as jest.Mock).mockImplementation((_u, _k, opts) => {
      setAll = opts.cookies.setAll;
      return {
        auth: {
          getClaims: jest.fn(async () => {
            setAll([{ name: 'sb', value: 'tok', options: { path: '/' } }]);
            return { data: { claims: { sub: 'u1' } } };
          }),
        },
      };
    });
    const req = request('/recipes/1');
    const response = await updateSession(req);
    expect(response.cookies.get('sb')?.value).toBe('tok');
    expect(req.cookies.get('sb')?.value).toBe('tok');
  });
});
