'use client';

import { useRef } from 'react';

import Button from '@/components/Button/Button.component';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { deleteRecipe } from '@/lib/actions/recipes';

import styles from './DeleteButton.module.css';

interface DeleteButtonProps {
  recipeId: number;
}

export default function DeleteButton({ recipeId }: DeleteButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        aria-label="Delete recipe"
        iconOnly
        onClick={() => dialogRef.current?.showModal()}
      >
        <TrashIcon />
      </Button>
      <dialog ref={dialogRef} className={styles.dialog}>
        <div className={styles.content}>
          <h2>Delete Recipe</h2>
          <p>Are you sure you want to delete this recipe?</p>
          <div className={styles.buttons}>
            <Button onClick={() => deleteRecipe(recipeId)}>Delete</Button>
            <Button
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
