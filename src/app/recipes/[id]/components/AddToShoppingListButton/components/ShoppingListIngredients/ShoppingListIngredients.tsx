import { Replace } from 'lucide-react';
import { ChangeEvent } from 'react';

import Button from '@/components/atoms/Button/Button';
import Checkbox from '@/components/atoms/Checkbox/Checkbox';
import {
  CombinedIngredients,
  IngredientSwaps,
} from '@/lib/utils/shoppingListSwaps';
import { RecipeIngredientDisplay } from '@/types';

import styles from './ShoppingListIngredients.module.css';

interface ShoppingListIngredientsProps {
  // Rows to show, already sorted by category
  combinedIngredients: CombinedIngredients[];
  // The original (unswapped) lines by id, for checkbox labels and "instead of"
  originalsById: Map<string, RecipeIngredientDisplay>;
  swaps: IngredientSwaps;
  selectedIds: Set<string>;
  error: string | null;
  onToggle: (id: string, checked: boolean) => void;
  onSwap: (row: CombinedIngredients) => void;
}

export default function ShoppingListIngredients({
  combinedIngredients,
  originalsById,
  swaps,
  selectedIds,
  error,
  onToggle,
  onSwap,
}: ShoppingListIngredientsProps) {
  const ingredientsByCategory = Object.groupBy(
    combinedIngredients,
    (ingredient) => ingredient.category,
  );

  return (
    <>
      <p>Choose which ingredients to add to your shopping list:</p>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.scrollArea}>
        <ul className={styles.categoriesList}>
          {Object.entries(ingredientsByCategory).map(
            ([category, ingredients]) => (
              <li key={category} className={styles.category}>
                <h3>{category}</h3>
                <ul className={styles.ingredientList}>
                  {ingredients?.map((ingredient) => {
                    const swappedFrom = Array.from(
                      new Set(
                        ingredient.sourceIngredients
                          .filter((source) => swaps[source.id])
                          .map((source) => {
                            const original = originalsById.get(source.id);
                            return (
                              original?.normalizedIngredientName ??
                              original?.name
                            );
                          }),
                      ),
                    );

                    return (
                      <li key={ingredient.ingredientId}>
                        <div className={styles.ingredientRow}>
                          <div className={styles.ingredient}>
                            <span>
                              {ingredient.quantity
                                ? `${ingredient.quantity} ${ingredient.unit}`
                                : null}{' '}
                              {ingredient.name}
                            </span>
                            {swappedFrom.length > 0 && (
                              <small className={styles.swapped}>
                                instead of {swappedFrom.join(', ')}
                              </small>
                            )}
                            <small className={styles.lines}>
                              {ingredient.sourceIngredients.map((source) => {
                                const original =
                                  originalsById.get(source.id) ?? source;
                                return (
                                  <Checkbox
                                    key={source.id}
                                    label={`${original.quantity ?? ''} ${original.name}`.trim()}
                                    labelSize="small"
                                    checkboxSize="small"
                                    alignItems="start"
                                    containerClassName={styles.line}
                                    checked={selectedIds.has(source.id)}
                                    onChange={(
                                      e: ChangeEvent<HTMLInputElement>,
                                    ) => onToggle(source.id, e.target.checked)}
                                  />
                                );
                              })}
                            </small>
                          </div>
                          {ingredient.ingredientId && (
                            <Button
                              variant="secondary"
                              size="small"
                              aria-label={`Swap ${ingredient.name}`}
                              onClick={() => onSwap(ingredient)}
                              className={styles.swapButton}
                            >
                              <Replace size={14} aria-hidden /> Swap
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ),
          )}
        </ul>
      </div>
    </>
  );
}
