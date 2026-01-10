import { RefObject, useEffect, useState } from 'react';

import RatingInput from '@/components/atoms/RatingInput/RatingInput';

interface RatingFilterProps {
  ratingInitialValue: number;
  updateActiveFilters: (filterName: string, isActive: boolean) => void;
  labelClassName?: string;
  formRef: RefObject<HTMLFormElement | null>;
}

export default function RatingFilter({
  ratingInitialValue,
  updateActiveFilters,
  labelClassName,
  formRef,
}: RatingFilterProps) {
  const [rating, setRating] = useState(ratingInitialValue);

  const handleRatingChange = (rating: number) => {
    setRating(rating);
    updateActiveFilters('rating', rating !== 0);
  };

  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const handleReset = () => {
      setRating(0);
      updateActiveFilters('rating', false);
    };

    form.addEventListener('reset', handleReset);
  }, [formRef, updateActiveFilters, ratingInitialValue]);

  return (
    <div>
      <p className={labelClassName}>Minimum Rating</p>
      <RatingInput rating={rating} onRatingChange={handleRatingChange} />
    </div>
  );
}
