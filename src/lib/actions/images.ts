'use server';

import { createClient } from '@/lib/supabase/server';

export async function uploadImageFromUrl(
  imageUrl: string,
  recipeId: string,
): Promise<string | null> {
  const supabase = await createClient();

  try {
    // Fetch the image from the URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Get the image as a blob
    const blob = await response.blob();

    // Determine file extension from content type or URL
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.split('/')[1] || 'jpg';
    const fileName = `${recipeId}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, blob, {
        contentType: contentType,
        upsert: true,
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
