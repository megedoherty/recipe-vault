/** @jest-environment node */
import { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import { GET } from './route';

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
jest.mock('@/lib/supabase/server');

const verifyOtp = jest.fn();

const request = (query: string) =>
  new Request(`http://localhost:3000/auth/confirm${query}`) as NextRequest;

describe('GET /auth/confirm', () => {
  beforeEach(() => {
    verifyOtp.mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockResolvedValue({ auth: { verifyOtp } });
  });

  it('verifies the token and redirects to the root by default', async () => {
    await expect(GET(request('?token_hash=abc&type=email'))).rejects.toThrow(
      'NEXT_REDIRECT:/',
    );
    expect(verifyOtp).toHaveBeenCalledWith({
      type: 'email',
      token_hash: 'abc',
    });
  });

  it('redirects to the "next" param after verifying', async () => {
    await expect(
      GET(request('?token_hash=abc&type=email&next=/recipes/add')),
    ).rejects.toThrow('NEXT_REDIRECT:/recipes/add');
  });

  it('redirects to the error page when verification fails', async () => {
    verifyOtp.mockResolvedValue({ error: new Error('expired') });

    await expect(GET(request('?token_hash=abc&type=email'))).rejects.toThrow(
      'NEXT_REDIRECT:/auth/auth-code-error',
    );
  });

  it.each([
    ['token_hash is missing', '?type=email'],
    ['type is missing', '?token_hash=abc'],
    ['both are missing', ''],
  ])(
    'redirects to the error page without calling Supabase when %s',
    async (_, query) => {
      await expect(GET(request(query))).rejects.toThrow(
        'NEXT_REDIRECT:/auth/auth-code-error',
      );
      expect(createClient).not.toHaveBeenCalled();
      expect(verifyOtp).not.toHaveBeenCalled();
    },
  );
});
