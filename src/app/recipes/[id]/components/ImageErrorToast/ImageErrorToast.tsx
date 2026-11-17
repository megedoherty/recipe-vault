'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useToast } from '@/components/molecules/Toast/ToastProvider';

/**
 * Shows a toast when a recipe was saved but its image couldn't be imported
 * (the save actions redirect here with `?imageError=1`), then clears the param.
 */
export default function ImageErrorToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const hasError = searchParams.get('imageError') === '1';

  useEffect(() => {
    if (!hasError) {
      return;
    }
    showToast(
      "Recipe saved, but the image couldn't be imported. Edit the recipe to try another image.",
    );
    router.replace(pathname, { scroll: false });
  }, [hasError, pathname, router, showToast]);

  return null;
}
