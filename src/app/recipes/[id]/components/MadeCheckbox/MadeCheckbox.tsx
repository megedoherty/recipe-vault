'use client';

import { ChangeEvent, startTransition, useOptimistic, useState } from 'react';

import Checkbox from '@/components/atoms/Checkbox/Checkbox';
import { useToast } from '@/components/molecules/Toast/ToastProvider';
import { toggleRecipeMade } from '@/lib/actions/recipes';

interface MadeCheckboxProps {
  recipeId: string;
  initialChecked: boolean;
  // Show the state but don't allow changing it
  readOnly?: boolean;
}

export default function MadeCheckbox({
  recipeId,
  initialChecked,
  readOnly = false,
}: MadeCheckboxProps) {
  const { showToast } = useToast();

  // The last state the server confirmed
  const [checked, setChecked] = useState(initialChecked);

  // What we show: flips immediately, and React drops it back to `checked`
  // when the transition ends, so a failed request rolls back by itself
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(checked);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    startTransition(async () => {
      setOptimisticChecked(newChecked);
      try {
        await toggleRecipeMade(recipeId, newChecked);
        startTransition(() => setChecked(newChecked));
      } catch (error) {
        console.error(error);
        showToast("Couldn't save. Please try again!");
      }
    });
  };

  return (
    <Checkbox
      label="I made this"
      name="made"
      checked={optimisticChecked}
      onChange={handleChange}
      disabled={readOnly}
      alignItems="center"
    />
  );
}
