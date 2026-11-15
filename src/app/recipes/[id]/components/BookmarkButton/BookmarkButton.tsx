'use client';

import { Bookmark } from 'lucide-react';
import { startTransition, useOptimistic, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import { toggleRecipeBookmarked } from '@/lib/actions/recipes';

interface BookmarkButtonProps {
  recipeId: string;
  initialBookmarked: boolean;
}

export default function BookmarkButton({
  recipeId,
  initialBookmarked,
}: BookmarkButtonProps) {
  // The last state the server confirmed
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  // What we show: flips immediately, and React drops it back to `bookmarked`
  // when the transition ends, so a failed request rolls back by itself
  const [optimisticBookmarked, setOptimisticBookmarked] =
    useOptimistic(bookmarked);

  const handleClick = () => {
    const newBookmarked = !optimisticBookmarked;
    startTransition(async () => {
      setOptimisticBookmarked(newBookmarked);
      try {
        await toggleRecipeBookmarked(recipeId, newBookmarked);
        startTransition(() => setBookmarked(newBookmarked));
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <Button
      iconOnly
      onClick={handleClick}
      aria-pressed={optimisticBookmarked}
      aria-label={optimisticBookmarked ? 'Remove bookmark' : 'Bookmark recipe'}
    >
      <Bookmark fill={optimisticBookmarked ? 'currentColor' : 'none'} />
    </Button>
  );
}
