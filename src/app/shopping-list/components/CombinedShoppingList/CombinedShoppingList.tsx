'use client';

import { ChangeEvent, startTransition, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import Checkbox from '@/components/atoms/Checkbox/Checkbox';
import TrashIcon from '@/components/atoms/icons/TrashIcon';
import {
  removeFromShoppingList,
  setPurchased,
} from '@/lib/actions/shoppingList';
import { sortByIngredientCategory } from '@/lib/utils/sort';
import { CombinedShoppingListItem } from '@/types';

import { OptimisticShoppingListAction } from '../ShoppingListView/ShoppingListView';
import styles from './CombinedShoppingList.module.css';

interface CombinedShoppingListProps {
  items: CombinedShoppingListItem[];
  onOptimisticUpdate: (action: OptimisticShoppingListAction) => void;
  preferGrams: boolean;
  onToggleUnits: () => void;
}

export default function CombinedShoppingList({
  items,
  onOptimisticUpdate,
  preferGrams,
  onToggleUnits,
}: CombinedShoppingListProps) {
  const [showDetails, setShowDetails] = useState(true);

  const itemsByCategory = Object.groupBy(
    sortByIngredientCategory(items),
    (item) => item.category,
  );

  const handleTogglePurchased = (
    item: CombinedShoppingListItem,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const checked = e.target.checked;
    startTransition(async () => {
      onOptimisticUpdate({
        type: 'setPurchased',
        itemIds: item.sourceItemIds,
        purchased: checked,
      });
      await setPurchased(item.sourceItemIds, checked);
    });
  };

  const handleRemove = (item: CombinedShoppingListItem) => {
    startTransition(async () => {
      onOptimisticUpdate({ type: 'remove', itemIds: item.sourceItemIds });
      await removeFromShoppingList(item.sourceItemIds);
    });
  };

  if (items.length === 0) {
    return <p>Your shopping list is empty.</p>;
  }

  return (
    <div>
      <div className={styles.toggleRow}>
        <Button variant="secondary" onClick={onToggleUnits}>
          {preferGrams ? 'Show imperial units' : 'Show grams'}
        </Button>
        <Button variant="secondary" onClick={() => setShowDetails((v) => !v)}>
          {showDetails ? 'Hide details' : 'Show details'}
        </Button>
      </div>
      <ul className={styles.categoriesList}>
        {Object.entries(itemsByCategory).map(([category, items]) => (
          <li key={category}>
            <h3>{category}</h3>
            <ul
              className={`${styles.itemList} ${showDetails ? '' : styles.compactList}`}
            >
              {items?.map((item) => (
                <li
                  key={item.groupKey}
                  className={`${styles.item} ${showDetails ? '' : styles.compact}`}
                >
                  <Checkbox
                    id={item.groupKey}
                    label={
                      item.quantity
                        ? `${item.quantity} ${item.unit} ${item.name}`
                        : item.name
                    }
                    checked={item.purchased}
                    alignItems="center"
                    onChange={(e) => handleTogglePurchased(item, e)}
                  />
                  {showDetails && (
                    <ul className={styles.lines}>
                      {item.lines.map((line, index) => (
                        <li key={`${line}-${index}`} className={styles.line}>
                          {line}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    aria-label={`Remove ${item.name}`}
                    variant="secondary"
                    iconOnly
                    onClick={() => handleRemove(item)}
                  >
                    <TrashIcon />
                  </Button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
