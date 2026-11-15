'use client';

import { startTransition, useOptimistic, useState } from 'react';

import RatingInput from '@/components/atoms/RatingInput/RatingInput';
import { useToast } from '@/components/molecules/Toast/ToastProvider';
import { updateRecipeRating } from '@/lib/actions/recipes';

interface RatingInputFormProps {
  recipeId: string;
  initialRating: number | null;
  // Show the rating but don't allow changing it
  readOnly?: boolean;
}

export default function RatingInputForm({
  recipeId,
  initialRating,
  readOnly = false,
}: RatingInputFormProps) {
  const { showToast } = useToast();

  // The last rating the server confirmed
  const [rating, setRating] = useState(initialRating || 0);

  // What we show: updates immediately, and React drops it back to `rating`
  // when the transition ends, so a failed request rolls back by itself
  const [optimisticRating, setOptimisticRating] = useOptimistic(rating);

  const handleChange = (newRating: number) => {
    startTransition(async () => {
      setOptimisticRating(newRating);
      try {
        await updateRecipeRating(recipeId, newRating);
        startTransition(() => setRating(newRating));
      } catch (error) {
        console.error(error);
        showToast("Couldn't save rating. Please try again!");
      }
    });
  };

  return (
    <form>
      <RatingInput
        rating={optimisticRating}
        onRatingChange={handleChange}
        readOnly={readOnly}
      />
    </form>
  );
}
