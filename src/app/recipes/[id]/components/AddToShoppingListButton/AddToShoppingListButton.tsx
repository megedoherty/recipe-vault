'use client';

import { List } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';

import Button from '@/components/atoms/Button/Button';
import Dialog, { DialogRef } from '@/components/molecules/Dialog/Dialog';
import { addToShoppingList } from '@/lib/actions/shoppingList';
import {
  applySwaps,
  CombinedIngredients,
  combineIngredients,
  IngredientSwaps,
  updateSwaps,
} from '@/lib/utils/shoppingListSwaps';
import { IngredientForRecipeEdit, RecipeIngredientDisplay } from '@/types';

import styles from './AddToShoppingListButton.module.css';
import IngredientSwapPicker from './components/IngredientSwapPicker/IngredientSwapPicker';
import ShoppingListIngredients from './components/ShoppingListIngredients/ShoppingListIngredients';

interface AddToShoppingListButtonProps {
  ingredients: RecipeIngredientDisplay[];
  recipeId: string;
  recipeName: string;
  // Ingredients a line can be swapped for (e.g. all-purpose flour -> GF flour)
  ingredientOptions?: IngredientForRecipeEdit[];
}

export default function AddToShoppingListButton({
  ingredients,
  recipeId,
  recipeName,
  ingredientOptions = [],
}: AddToShoppingListButtonProps) {
  const dialogRef = useRef<DialogRef>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(ingredients.map((ingredient) => ingredient.id)),
  );
  const [error, setError] = useState<string | null>(null);
  // Swapped ingredient per recipe ingredient line id
  const [swaps, setSwaps] = useState<IngredientSwaps>({});
  // The combined row being swapped; when set, the dialog shows the swap picker
  const [swapTarget, setSwapTarget] = useState<CombinedIngredients | null>(
    null,
  );

  const originalsById = new Map(
    ingredients.map((ingredient) => [ingredient.id, ingredient]),
  );

  // Apply swaps before combining so a swapped line merges with any line that
  // already uses the replacement ingredient.
  const selectedIngredients = applySwaps(
    ingredients.filter((ingredient) => selectedIds.has(ingredient.id)),
    swaps,
  );
  const combinedIngredients = combineIngredients(selectedIngredients);

  const toggleIngredient = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const closeSwapView = () => setSwapTarget(null);

  const chooseSwap = (optionId: string) => {
    if (swapTarget) {
      const option = ingredientOptions.find((o) => o.id === optionId);
      setSwaps((prev) =>
        updateSwaps(
          prev,
          swapTarget.sourceIngredients.map((source) => source.id),
          option,
          originalsById,
        ),
      );
    }
    closeSwapView();
  };

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await addToShoppingList(
        selectedIngredients,
        recipeId,
        recipeName,
      );

      if (result.success) {
        dialogRef.current?.close();
      } else {
        setError(result.error ?? 'Failed to add to shopping list');
      }
    });
  };

  return (
    <>
      <Button
        aria-label="Shopping list"
        iconOnly
        onClick={() => dialogRef.current?.showModal()}
      >
        <List />
      </Button>
      <Dialog
        ref={dialogRef}
        className={styles.dialog}
        title={swapTarget ? `Replace ${swapTarget.name}` : 'Shopping List'}
        onClose={() => {
          closeSwapView();
          dialogRef.current?.close();
        }}
        footer={
          swapTarget ? (
            <Button variant="secondary" onClick={closeSwapView}>
              Back
            </Button>
          ) : (
            <>
              <Button
                onClick={handleConfirm}
                disabled={isPending || selectedIds.size === 0}
              >
                Add to List
              </Button>
              <Button
                variant="secondary"
                onClick={() => dialogRef.current?.close()}
              >
                Cancel
              </Button>
            </>
          )
        }
      >
        {swapTarget ? (
          <IngredientSwapPicker
            target={swapTarget}
            options={ingredientOptions}
            isSwapped={swapTarget.sourceIngredients.some(
              (source) => swaps[source.id],
            )}
            onChoose={chooseSwap}
          />
        ) : (
          <ShoppingListIngredients
            combinedIngredients={combinedIngredients}
            originalsById={originalsById}
            swaps={swaps}
            selectedIds={selectedIds}
            error={error}
            onToggle={toggleIngredient}
            onSwap={setSwapTarget}
          />
        )}
      </Dialog>
    </>
  );
}
