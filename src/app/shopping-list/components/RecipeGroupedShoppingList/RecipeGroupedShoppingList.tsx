'use client';

import { startTransition } from 'react';

import Button from '@/components/atoms/Button/Button';
import TrashIcon from '@/components/atoms/icons/TrashIcon';
import { removeFromShoppingList } from '@/lib/actions/shoppingList';
import { CombinedShoppingListItem, ShoppingListByRecipe } from '@/types';

import { OptimisticShoppingListAction } from '../ShoppingListView/ShoppingListView';
import styles from './RecipeGroupedShoppingList.module.css';

interface RecipeGroupedShoppingListProps {
  groups: ShoppingListByRecipe[];
  combinedItems: CombinedShoppingListItem[];
  onOptimisticUpdate: (action: OptimisticShoppingListAction) => void;
}

export default function RecipeGroupedShoppingList({
  groups,
  combinedItems,
  onOptimisticUpdate,
}: RecipeGroupedShoppingListProps) {
  const purchasedBySourceItemId = new Set(
    combinedItems
      .filter((item) => item.purchased)
      .flatMap((item) => item.sourceItemIds),
  );

  const handleRemoveRecipe = (group: ShoppingListByRecipe) => {
    const itemIds = group.items.map((item) => item.id);
    startTransition(async () => {
      onOptimisticUpdate({ type: 'remove', itemIds });
      await removeFromShoppingList(itemIds);
    });
  };

  if (groups.length === 0) {
    return <p>Your shopping list is empty.</p>;
  }

  return (
    <ul className={styles.groupsList}>
      {groups.map((group) => (
        <li key={group.recipeId ?? 'manual'}>
          <div className={styles.groupHeader}>
            <h3>{group.recipeName}</h3>
            <Button
              aria-label={`Remove ${group.recipeName}`}
              variant="secondary"
              iconOnly
              onClick={() => handleRemoveRecipe(group)}
            >
              <TrashIcon />
            </Button>
          </div>
          <ul className={styles.itemList}>
            {group.items.map((item) => (
              <li
                key={item.id}
                className={
                  purchasedBySourceItemId.has(item.id)
                    ? styles.purchased
                    : undefined
                }
              >
                {item.quantity ? `${item.quantity} ${item.name}` : item.name}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
