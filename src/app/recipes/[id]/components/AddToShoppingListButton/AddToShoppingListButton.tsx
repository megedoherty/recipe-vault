'use client';

import { useRef } from 'react';

import Button from '@/components/atoms/Button/Button';
import ListIcon from '@/components/atoms/icons/ListIcon';
import Dialog, { DialogRef } from '@/components/molecules/Dialog/Dialog';
import { sortByIngredientCategory } from '@/lib/utils/sort';
import { RecipeIngredientDisplay } from '@/types';

import styles from './AddToShoppingListButton.module.css';
import { combineGrams, combineNonGramsQuantity } from './utils';

interface CombinedIngredients {
  ingredientId: string;
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  lines: string[];
}

interface AddToShoppingListButtonProps {
  ingredients: RecipeIngredientDisplay[];
}

export default function AddToShoppingListButton({
  ingredients,
}: AddToShoppingListButtonProps) {
  const dialogRef = useRef<DialogRef>(null);

  // Combine ingredients with the same normalized ingredient id
  const combinedIngredients = Object.groupBy(
    ingredients,
    (ingredient) => ingredient.normalizedIngredientId?.toString() ?? '',
  );
  console.log(
    '🚀 ~ AddToShoppingListButton ~ combinedIngredients:',
    combinedIngredients,
  );

  const combinedIngredientsList: CombinedIngredients[] = Object.entries(
    combinedIngredients,
  )
    .map(([ingredientId, ingredients]) => {
      if (!ingredients || ingredients.length === 0) {
        return null;
      }

      const gramsQuantity = combineGrams(ingredients);

      const [nonGramsQuantity, unit] = combineNonGramsQuantity(ingredients) ?? [
        null,
        null,
      ];

      return {
        ingredientId,
        category: ingredients[0].category,
        name: ingredients[0].normalizedIngredientName ?? ingredients[0].name,
        quantity: gramsQuantity || nonGramsQuantity,
        unit: gramsQuantity ? 'g' : unit,
        lines: ingredients.map(
          (ingredient) => `${ingredient.quantity} ${ingredient.name}`,
        ),
      };
    })
    .filter((ingredient) => ingredient !== null);

  const ingredientsByCategory = Object.groupBy(
    sortByIngredientCategory(combinedIngredientsList),
    (ingredient) => ingredient.category,
  );

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
        footer={
          <Button
            variant="secondary"
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </Button>
        }
      >
        <p>Here&apos;s the info for your shopping list:</p>
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
                          {ingredient.lines.map((line, index) => (
                            <p key={`${line}-${index}`} className={styles.line}>
                              {line}
                            </p>
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
