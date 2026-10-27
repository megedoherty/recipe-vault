'use client';

import { useState, useTransition } from 'react';

import RatingInput from '@/components/atoms/RatingInput/RatingInput';
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
  const [rating, setRating] = useState(initialRating || 0);
  const [isPending, startTransition] = useTransition();

  const handleChange = (newRating: number) => {
    startTransition(async () => {
      try {
        await updateRecipeRating(recipeId, newRating);
        setRating(newRating);
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <form>
      <RatingInput
        rating={rating}
        onRatingChange={handleChange}
        isDisabled={isPending}
        readOnly={readOnly}
      />
    </form>
  );
}
