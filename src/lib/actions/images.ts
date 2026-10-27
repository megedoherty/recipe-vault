'use server';

import { createClient } from '@/lib/supabase/server';
import { safeFetch } from '@/lib/utils/safeFetch';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export async function uploadImageFromUrl(
  imageUrl: string,
  recipeId: string,
): Promise<string | null> {
  const supabase = await createClient();

  try {
    // Fetch the image (blocks internal addresses, caps size)
    const response = await safeFetch(imageUrl, {
      maxBytes: MAX_IMAGE_BYTES,
      timeoutMs: 10000,
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Only accept known image types; derive the extension from our own
    // allowlist rather than trusting the remote content type
    const contentType = String(response.headers['content-type'] ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    const extension = IMAGE_EXTENSIONS[contentType];
    if (!extension) {
      throw new Error(`Unsupported image type: ${contentType || 'unknown'}`);
    }
    const blob = new Blob([new Uint8Array(response.body)], {
      type: contentType,
    });

    // Timestamp keeps the public URL unique so browser/CDN caches don't serve a stale image
    const fileName = `${recipeId}-${Date.now()}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, blob, {
        contentType: contentType,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error processing image upload:', error);
    return null;
  }
}
