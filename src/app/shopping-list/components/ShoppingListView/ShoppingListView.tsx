'use client';

import { useOptimistic, useState } from 'react';

import Tabs from '@/components/atoms/Tabs/Tabs';
import { setPreferGramsCookie } from '@/lib/utils/preferences';
import { groupByRecipe, groupCombined } from '@/lib/utils/shoppingList';
import { IngredientForRecipeEdit, ShoppingListItem } from '@/types';

import AddCustomListButton from '../AddCustomListButton/AddCustomListButton';
import ClearListButton from '../ClearListButton/ClearListButton';
import CombinedShoppingList from '../CombinedShoppingList/CombinedShoppingList';
import RecipeGroupedShoppingList from '../RecipeGroupedShoppingList/RecipeGroupedShoppingList';
import styles from './ShoppingListView.module.css';

interface ShoppingListViewProps {
  items: ShoppingListItem[];
  initialPreferGrams: boolean;
  // Master ingredients for matching lines in a custom list
  ingredientOptions?: IngredientForRecipeEdit[];
}

export type OptimisticShoppingListAction =
  | { type: 'setPurchased'; itemIds: string[]; purchased: boolean }
  | { type: 'remove'; itemIds: string[] }
  | { type: 'clear' };

function shoppingListReducer(
  items: ShoppingListItem[],
  action: OptimisticShoppingListAction,
): ShoppingListItem[] {
  switch (action.type) {
    case 'setPurchased':
      return items.map((item) =>
        action.itemIds.includes(item.id)
          ? { ...item, purchased: action.purchased }
          : item,
      );
    case 'remove':
      return items.filter((item) => !action.itemIds.includes(item.id));
    case 'clear':
      return [];
  }
}

export default function ShoppingListView({
  items,
  initialPreferGrams,
  ingredientOptions = [],
}: ShoppingListViewProps) {
  const [preferGrams, setPreferGrams] = useState(initialPreferGrams);
  const [optimisticItems, dispatchOptimistic] = useOptimistic(
    items,
    shoppingListReducer,
  );

  const handleToggleUnits = () => {
    setPreferGrams((prev) => {
      const next = !prev;
      setPreferGramsCookie(next);
      return next;
    });
  };

  const combined = groupCombined(optimisticItems, preferGrams);
  const byRecipe = groupByRecipe(optimisticItems);

  return (
    <div>
      <div className={styles.header}>
        <h1>Shopping List</h1>
        <div className={styles.actions}>
          <AddCustomListButton ingredientOptions={ingredientOptions} />
          <ClearListButton
            onClear={() => dispatchOptimistic({ type: 'clear' })}
          />
        </div>
      </div>
      <Tabs
        label="Shopping list view"
        tabs={[
          {
            id: 'combined',
            label: 'Combined',
            content: (
              <CombinedShoppingList
                items={combined}
                onOptimisticUpdate={dispatchOptimistic}
                preferGrams={preferGrams}
                onToggleUnits={handleToggleUnits}
              />
            ),
          },
          {
            id: 'byRecipe',
            label: 'By Recipe',
            content: (
              <RecipeGroupedShoppingList
                groups={byRecipe}
                combinedItems={combined}
                onOptimisticUpdate={dispatchOptimistic}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
