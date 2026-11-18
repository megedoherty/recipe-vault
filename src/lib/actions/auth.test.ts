/** @jest-environment node */
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { signIn, signUp } from './auth';
import { createSupabaseMock } from './testUtils';

jest.mock('next/headers', () => ({ headers: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));

const formData = () => {
  const data = new FormData();
  data.set('email', 'cook@example.com');
  data.set('password', 'secret');
  return data;
};

const setHeaders = (values: Record<string, string>) =>
  (headers as jest.Mock).mockResolvedValue({
    get: (name: string) => values[name] ?? null,
  });

describe('auth actions', () => {
  let supabase: ReturnType<typeof createSupabaseMock>;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    supabase = createSupabaseMock();
    (createClient as jest.Mock).mockResolvedValue(supabase);
    consoleError = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  describe('signUp', () => {
    beforeEach(() => {
      setHeaders({ origin: 'https://recipes.test' });
      supabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      });
    });

    it('signs up with the confirm redirect built from the origin header', async () => {
      await signUp(formData());

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'cook@example.com',
        password: 'secret',
        options: { emailRedirectTo: 'https://recipes.test/auth/confirm' },
      });
    });

    it('falls back to the host header over https', async () => {
      setHeaders({ host: 'recipes.example.com' });

      await signUp(formData());

      expect(supabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: {
            emailRedirectTo: 'https://recipes.example.com/auth/confirm',
          },
        }),
      );
    });

    it('falls back to NEXT_PUBLIC_SITE_URL when there are no headers', async () => {
      setHeaders({});
      const original = process.env.NEXT_PUBLIC_SITE_URL;
      process.env.NEXT_PUBLIC_SITE_URL = 'https://site.test';

      await signUp(formData());

      process.env.NEXT_PUBLIC_SITE_URL = original;
      expect(supabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: { emailRedirectTo: 'https://site.test/auth/confirm' },
        }),
      );
    });

    it('falls back to localhost when nothing is configured', async () => {
      setHeaders({});
      const original = process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;

      await signUp(formData());

      process.env.NEXT_PUBLIC_SITE_URL = original;
      expect(supabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: { emailRedirectTo: 'http://localhost:3000/auth/confirm' },
        }),
      );
    });

    it('redirects home when a user is returned', async () => {
      await signUp(formData());

      expect(redirect).toHaveBeenCalledWith('/');
    });

    it('logs the error and does not redirect when no user is returned', async () => {
      const error = { message: 'Email taken' };
      supabase.auth.signUp.mockResolvedValue({ data: { user: null }, error });

      await signUp(formData());

      expect(consoleError).toHaveBeenCalledWith(error);
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    it('signs in with the submitted credentials and redirects home', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      });

      await signIn(formData());

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'cook@example.com',
        password: 'secret',
      });
      expect(redirect).toHaveBeenCalledWith('/');
    });

    it('logs the error and does not redirect when sign in fails', async () => {
      const error = { message: 'Invalid login' };
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error,
      });

      await signIn(formData());

      expect(consoleError).toHaveBeenCalledWith(error);
      expect(redirect).not.toHaveBeenCalled();
    });
  });
});
