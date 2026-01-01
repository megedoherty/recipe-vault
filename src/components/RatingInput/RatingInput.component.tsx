'use client';

import { useRef, useState, useTransition } from 'react';

import { updateRecipeRating } from '@/lib/actions/recipes';

import styles from './RatingInput.module.css';

interface RatingInputProps {
  recipeId: number;
  initialRating: number | null;
}

export default function RatingInput({
  recipeId,
  initialRating,
}: RatingInputProps) {
  const [rating, setRating] = useState(initialRating || 0);
  const [isPending, startTransition] = useTransition();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown'
    ) {
      e.preventDefault();

      let nextIndex: number;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      } else {
        nextIndex = currentIndex < 4 ? currentIndex + 1 : 4;
      }

      // Move focus to the next/previous input
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Only change value on Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleChange(currentIndex + 1);
    }
  };

  return (
    <form className={styles.ratingSelect}>
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const isFilled = rating >= starValue;
        return (
          <div key={index} className={styles.itemWrapper}>
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="radio"
              name="rating"
              id={`rating-${starValue}`}
              value={starValue}
              onChange={() => handleChange(starValue)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              checked={rating === starValue}
              disabled={isPending}
              className="sr-only"
            />
            <label htmlFor={`rating-${starValue}`} className={styles.label}>
              <span className="sr-only">
                {`${starValue} ${starValue === 1 ? ' star' : ' stars'}`}
              </span>
              <svg
                aria-hidden="true"
                className={styles.starIcon}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  className={`${styles.starIconPath} ${isFilled ? styles.starFilled : styles.starOutline}`}
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </label>
          </div>
        );
      })}
    </form>
  );
}
