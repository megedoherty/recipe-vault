/** @jest-environment node */
import { getUser } from '@/lib/supabase/queries/user';
import { createClient } from '@/lib/supabase/server';
import { safeFetch } from '@/lib/utils/safeFetch';

import { uploadImageFromUrl } from './images';

jest.mock('@/lib/supabase/queries/user', () => ({ getUser: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/utils/safeFetch', () => ({ safeFetch: jest.fn() }));

const mockSafeFetch = safeFetch as jest.Mock;

const imageResponse = (
  contentType: string | undefined,
  status = 200,
  body = Buffer.from([1, 2, 3]),
) => ({
  status,
  headers: contentType === undefined ? {} : { 'content-type': contentType },
  body,
});

describe('uploadImageFromUrl', () => {
  const upload = jest.fn();
  const getPublicUrl = jest.fn();
  const from = jest.fn();
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    consoleError = jest.spyOn(console, 'error').mockImplementation();
    (getUser as jest.Mock).mockResolvedValue({ id: 'u1' });
    from.mockReturnValue({ upload, getPublicUrl });
    (createClient as jest.Mock).mockResolvedValue({ storage: { from } });
    upload.mockResolvedValue({
      data: { path: 'r1-1700000000000.jpg' },
      error: null,
    });
    getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://proj.supabase.co/recipe-images/r1.jpg' },
    });
    mockSafeFetch.mockResolvedValue(imageResponse('image/jpeg'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns null without fetching when signed out', async () => {
    (getUser as jest.Mock).mockResolvedValue(null);

    await expect(
      uploadImageFromUrl('https://example.com/a.jpg', 'r1'),
    ).resolves.toBeNull();
    expect(mockSafeFetch).not.toHaveBeenCalled();
  });

  it('fetches with size/time limits and uploads under a unique name', async () => {
    const url = await uploadImageFromUrl('https://example.com/a.jpg', 'r1');

    expect(url).toBe('https://proj.supabase.co/recipe-images/r1.jpg');
    expect(mockSafeFetch).toHaveBeenCalledWith(
      'https://example.com/a.jpg',
      expect.objectContaining({
        maxBytes: 10 * 1024 * 1024,
        timeoutMs: 10000,
        headers: expect.objectContaining({
          'User-Agent': expect.any(String),
          Accept: expect.stringContaining('image/'),
        }),
      }),
    );
    expect(from).toHaveBeenCalledWith('recipe-images');
    expect(upload).toHaveBeenCalledWith(
      'r1-1700000000000.jpg',
      expect.any(Blob),
      { contentType: 'image/jpeg' },
    );
    expect(getPublicUrl).toHaveBeenCalledWith('r1-1700000000000.jpg');
  });

  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
    ['image/gif', 'gif'],
    ['image/avif', 'avif'],
  ])('derives the %s extension from the allowlist', async (type, ext) => {
    mockSafeFetch.mockResolvedValue(imageResponse(type));

    await uploadImageFromUrl('https://example.com/a', 'r1');

    expect(upload).toHaveBeenCalledWith(
      `r1-1700000000000.${ext}`,
      expect.any(Blob),
      { contentType: type },
    );
  });

  it('normalizes content-type parameters and casing', async () => {
    mockSafeFetch.mockResolvedValue(imageResponse('Image/PNG; charset=binary'));

    await uploadImageFromUrl('https://example.com/a', 'r1');

    expect(upload).toHaveBeenCalledWith(
      'r1-1700000000000.png',
      expect.any(Blob),
      { contentType: 'image/png' },
    );
  });

  it.each([199, 301, 404, 500])(
    'returns null for HTTP status %i',
    async (status) => {
      mockSafeFetch.mockResolvedValue(imageResponse('image/jpeg', status));

      await expect(
        uploadImageFromUrl('https://example.com/a.jpg', 'r1'),
      ).resolves.toBeNull();
      expect(upload).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
    },
  );

  it('returns null for an unsupported content type', async () => {
    mockSafeFetch.mockResolvedValue(imageResponse('text/html'));

    await expect(
      uploadImageFromUrl('https://example.com/a.jpg', 'r1'),
    ).resolves.toBeNull();
    expect(upload).not.toHaveBeenCalled();
  });

  it('returns null when the content type is missing', async () => {
    mockSafeFetch.mockResolvedValue(imageResponse(undefined));

    await expect(
      uploadImageFromUrl('https://example.com/a.jpg', 'r1'),
    ).resolves.toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      'Error processing image upload:',
      expect.objectContaining({ message: 'Unsupported image type: unknown' }),
    );
  });

  it('returns null when the fetch is rejected (e.g. unsafe URL)', async () => {
    mockSafeFetch.mockRejectedValue(new Error('blocked'));

    await expect(
      uploadImageFromUrl('http://127.0.0.1/a.jpg', 'r1'),
    ).resolves.toBeNull();
    expect(upload).not.toHaveBeenCalled();
  });

  it('returns null when the storage upload fails', async () => {
    upload.mockResolvedValue({ data: null, error: { message: 'full' } });

    await expect(
      uploadImageFromUrl('https://example.com/a.jpg', 'r1'),
    ).resolves.toBeNull();
    expect(getPublicUrl).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith('Error uploading image:', {
      message: 'full',
    });
  });
});
