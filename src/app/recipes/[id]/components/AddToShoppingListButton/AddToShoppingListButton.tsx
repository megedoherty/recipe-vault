'use client';

import { ChangeEvent, useRef, useState, useTransition } from 'react';

import Button from '@/components/atoms/Button/Button';
import Checkbox from '@/components/atoms/Checkbox/Checkbox';
import ListIcon from '@/components/atoms/icons/ListIcon';
import Dialog, { DialogRef } from '@/components/molecules/Dialog/Dialog';
import { addToShoppingList } from '@/lib/actions/shoppingList';
import { resolveCombinedQuantity } from '@/lib/utils/shoppingList';
import { sortByIngredientCategory } from '@/lib/utils/sort';
import { RecipeIngredientDisplay } from '@/types';

import styles from './AddToShoppingListButton.module.css';

interface CombinedIngredients {
  ingredientId: string;
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  sourceIngredients: RecipeIngredientDisplay[];
}

interface AddToShoppingListButtonProps {
  ingredients: RecipeIngredientDisplay[];
  recipeId: string;
  recipeName: string;
}

export default function AddToShoppingListButton({
  ingredients,
  recipeId,
  recipeName,
}: AddToShoppingListButtonProps) {
  const dialogRef = useRef<DialogRef>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(ingredients.map((ingredient) => ingredient.id)),
  );
  const [error, setError] = useState<string | null>(null);

  const selectedIngredients = ingredients.filter((ingredient) =>
    selectedIds.has(ingredient.id),
  );

  // Combine selected ingredients with the same normalized ingredient id
  const combinedIngredients = Object.groupBy(
    selectedIngredients,
    (ingredient) => ingredient.normalizedIngredientId?.toString() ?? '',
  );

  const combinedIngredientsList: CombinedIngredients[] = Object.entries(
    combinedIngredients,
  )
    .map(([ingredientId, ingredients]) => {
      if (!ingredients || ingredients.length === 0) {
        return null;
      }

      const [quantity, unit] = resolveCombinedQuantity(ingredients, true);

      return {
        ingredientId,
        category: ingredients[0].category,
        name: ingredients[0].normalizedIngredientName ?? ingredients[0].name,
        quantity,
        unit,
        sourceIngredients: ingredients,
      };
    })
    .filter((ingredient) => ingredient !== null);

  const ingredientsByCategory = Object.groupBy(
    sortByIngredientCategory(combinedIngredientsList),
    (ingredient) => ingredient.category,
  );

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
        <ListIcon />
      </Button>
      <Dialog
        ref={dialogRef}
        title="Shopping List"
        onClose={() => dialogRef.current?.close()}
        footer={
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
        }
      >
        <p>Choose which ingredients to add to your shopping list:</p>
        {error && <p className={styles.error}>{error}</p>}
        <ul className={styles.categoriesList}>
          {Object.entries(ingredientsByCategory).map(
            ([category, ingredients]) => (
              <li key={category}>
                <h3>{category}</h3>
                <ul className={styles.ingredientList}>
                  {ingredients?.map((ingredient) => (
                    <li key={ingredient.ingredientId}>
                      <div className={styles.ingredient}>
                        {ingredient.quantity
                          ? `${ingredient.quantity} ${ingredient.unit}`
                          : null}{' '}
                        {ingredient.name}
                        <small className={styles.lines}>
                          {ingredient.sourceIngredients.map((source) => (
                            <Checkbox
                              key={source.id}
                              id={source.id}
                              label={`${source.quantity ?? ''} ${source.name}`.trim()}
                              labelSize="small"
                              checkboxSize="small"
                              containerClassName={styles.line}
                              checked={selectedIds.has(source.id)}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                toggleIngredient(source.id, e.target.checked)
                              }
                            />
                          ))}
                        </small>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ),
          )}
        </ul>
      </Dialog>
    </>
  );
}
