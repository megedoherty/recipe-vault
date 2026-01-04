'use client';

import { ChangeEvent, useState, useTransition } from 'react';

import Checkbox from '@/components/atoms/Checkbox/Checkbox';
import { toggleRecipeMade } from '@/lib/actions/recipes';

import styles from './MadeCheckbox.module.css';

interface MadeCheckboxProps {
  recipeId: string;
  initialChecked: boolean;
}

export default function MadeCheckbox({
  recipeId,
  initialChecked,
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
      sizeVariant="medium"
      id="made"
      name="made"
      checked={checked}
      onChange={handleChange}
      disabled={isPending}
      containerClassName={styles.container}
    />
  );
}
