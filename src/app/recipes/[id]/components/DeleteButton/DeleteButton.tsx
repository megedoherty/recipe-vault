'use client';

import { useRef } from 'react';

import Button from '@/components/atoms/Button/Button';
import TrashIcon from '@/components/atoms/icons/TrashIcon';
import Dialog, { DialogRef } from '@/components/molecules/Dialog/Dialog';
import { deleteRecipe } from '@/lib/actions/recipes';

interface DeleteButtonProps {
  recipeId: string;
}

export default function DeleteButton({ recipeId }: DeleteButtonProps) {
  const dialogRef = useRef<DialogRef>(null);

  return (
    <>
      <Button
        aria-label="Delete recipe"
        iconOnly
        onClick={() => dialogRef.current?.showModal()}
      >
        <TrashIcon />
      </Button>
      <Dialog
        ref={dialogRef}
        title="Delete Recipe"
        onClose={() => dialogRef.current?.close()}
        footer={
          <>
            <Button onClick={() => deleteRecipe(recipeId)}>Delete</Button>
            <Button
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete this recipe?</p>
      </Dialog>
    </>
  );
}
