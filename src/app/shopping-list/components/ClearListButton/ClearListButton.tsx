'use client';

import { startTransition, useRef } from 'react';

import Button from '@/components/atoms/Button/Button';
import Dialog, { DialogRef } from '@/components/molecules/Dialog/Dialog';
import { clearShoppingList } from '@/lib/actions/shoppingList';

interface ClearListButtonProps {
  onClear: () => void;
}

export default function ClearListButton({ onClear }: ClearListButtonProps) {
  const dialogRef = useRef<DialogRef>(null);

  const handleClear = () => {
    dialogRef.current?.close();
    startTransition(async () => {
      onClear();
      await clearShoppingList();
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => dialogRef.current?.showModal()}
      >
        Clear List
      </Button>
      <Dialog
        ref={dialogRef}
        title="Clear Shopping List"
        onClose={() => dialogRef.current?.close()}
        footer={
          <>
            <Button onClick={handleClear}>Confirm</Button>
            <Button
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to clear your entire shopping list? This removes
          every item, purchased or not.
        </p>
      </Dialog>
    </>
  );
}
