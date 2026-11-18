import { createBrowserClient } from '@supabase/ssr';

import { createClient } from './client';

jest.mock('@supabase/ssr', () => ({ createBrowserClient: jest.fn() }));

describe('createClient (browser)', () => {
  it('creates a browser client from the public env vars', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://supabase.test';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'key';
    const client = {};
    (createBrowserClient as jest.Mock).mockReturnValue(client);

    expect(createClient()).toBe(client);
    expect(createBrowserClient).toHaveBeenCalledWith(
      'http://supabase.test',
      'key',
    );
  });
});
