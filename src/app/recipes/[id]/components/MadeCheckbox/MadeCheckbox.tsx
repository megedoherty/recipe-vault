'use client';

import { ChangeEvent, useState, useTransition } from 'react';

import Checkbox from '@/components/atoms/Checkbox/Checkbox';
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
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(initialChecked);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    startTransition(async () => {
      try {
        await toggleRecipeMade(recipeId, newChecked);
        setChecked(newChecked);
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <Checkbox
      label="I made this"
      name="made"
      checked={checked}
      onChange={handleChange}
      disabled={isPending || readOnly}
      alignItems="center"
    />
  );
}
