'use client';

import { useOptimistic, useState } from 'react';

import { setPreferGramsCookie } from '@/lib/utils/preferences';
import { groupByRecipe, groupCombined } from '@/lib/utils/shoppingList';
import { ShoppingListItem } from '@/types';

import ClearListButton from '../ClearListButton/ClearListButton';
import CombinedShoppingList from '../CombinedShoppingList/CombinedShoppingList';
import RecipeGroupedShoppingList from '../RecipeGroupedShoppingList/RecipeGroupedShoppingList';
import styles from './ShoppingListView.module.css';

interface ShoppingListViewProps {
  items: ShoppingListItem[];
  initialPreferGrams: boolean;
}

type Tab = 'combined' | 'byRecipe';

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
}: ShoppingListViewProps) {
  const [tab, setTab] = useState<Tab>('combined');
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
        <ClearListButton
          onClear={() => dispatchOptimistic({ type: 'clear' })}
        />
      </div>
      <div role="tablist" className={styles.tabList}>
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'combined'}
          className={styles.tab}
          onClick={() => setTab('combined')}
        >
          Combined
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'byRecipe'}
          className={styles.tab}
          onClick={() => setTab('byRecipe')}
        >
          By Recipe
        </button>
      </div>
      {tab === 'combined' ? (
        <CombinedShoppingList
          items={combined}
          onOptimisticUpdate={dispatchOptimistic}
          preferGrams={preferGrams}
          onToggleUnits={handleToggleUnits}
        />
      ) : (
        <RecipeGroupedShoppingList
          groups={byRecipe}
          combinedItems={combined}
          onOptimisticUpdate={dispatchOptimistic}
        />
      )}
    </div>
  );
}
