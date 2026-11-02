import { useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import {
  CombinedIngredients,
  groupWithCategoryFirst,
} from '@/lib/utils/shoppingListSwaps';
import { IngredientForRecipeEdit } from '@/types';

import styles from './IngredientSwapPicker.module.css';

interface IngredientSwapPickerProps {
  // The combined row being swapped
  target: CombinedIngredients;
  // Ingredients the row can be swapped for
  options: IngredientForRecipeEdit[];
  // Whether the row already has a swap that can be undone
  isSwapped: boolean;
  // Called with the chosen ingredient id, or '' to use the original ingredient
  onChoose: (optionId: string) => void;
}

export default function IngredientSwapPicker({
  target,
  options,
  isSwapped,
  onChoose,
}: IngredientSwapPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const optionGroups = groupWithCategoryFirst(
    options.filter((option) =>
      option.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
    ),
    target.category,
  );

  return (
    <>
      <Input
        id="swap-search"
        name="swap-search"
        type="text"
        label="Search ingredients"
        hideLabel
        placeholder="Search ingredients"
        fullWidth
        autoFocus
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {isSwapped && (
        <Button
          variant="secondary"
          size="small"
          className={styles.useOriginal}
          onClick={() => onChoose('')}
        >
          Use original ingredient
        </Button>
      )}
      <div className={styles.scrollArea}>
        {optionGroups.length === 0 ? (
          <p>No ingredients found</p>
        ) : (
          optionGroups.map(({ category, items }) => (
            <section key={category} className={styles.optionGroup}>
              <h3>{category}</h3>
              <ul className={styles.optionList}>
                {items.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      className={styles.option}
                      aria-current={
                        option.id === target.ingredientId ? 'true' : undefined
                      }
                      onClick={() => onChoose(option.id)}
                    >
                      {option.name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}
