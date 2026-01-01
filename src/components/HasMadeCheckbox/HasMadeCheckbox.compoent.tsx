'use client';

import { ChangeEvent, useState, useTransition } from 'react';

import { toggleRecipeHasMade } from '@/lib/actions/recipes';

interface HasMadeCheckboxProps {
  recipeId: number;
  initialChecked: boolean;
}

export default function HasMadeCheckbox({
  recipeId,
  initialChecked,
}: HasMadeCheckboxProps) {
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(initialChecked);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    startTransition(async () => {
      try {
        await toggleRecipeHasMade(recipeId, newChecked);
        setChecked(newChecked);
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <div>
      <input
        type="checkbox"
        name="hasMade"
        id="hasMade"
        checked={checked}
        onChange={handleChange}
        disabled={isPending}
      />
      <label htmlFor="hasMade">Has made</label>
      {isPending && <span>Updating...</span>}
    </div>
  );
}
