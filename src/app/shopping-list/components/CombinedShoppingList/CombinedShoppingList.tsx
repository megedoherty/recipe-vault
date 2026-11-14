'use client';

import { Trash2 } from 'lucide-react';
import { ChangeEvent, startTransition, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import Checkbox from '@/components/atoms/Checkbox/Checkbox';
import Switch from '@/components/atoms/Switch/Switch';
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
  const [hidePurchased, setHidePurchased] = useState(false);

  const visibleItems = hidePurchased
    ? items.filter((item) => !item.purchased)
    : items;

  const itemsByCategory = Object.groupBy(
    sortByIngredientCategory(visibleItems),
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
        <Switch label="Grams" checked={preferGrams} onChange={onToggleUnits} />
        <Switch
          label="Details"
          checked={showDetails}
          onChange={() => setShowDetails((v) => !v)}
        />
        <Switch
          label="Hide checked"
          checked={hidePurchased}
          onChange={() => setHidePurchased((v) => !v)}
        />
      </div>
      {visibleItems.length === 0 && (
        <p>Everything on your list is checked off.</p>
      )}
      <ul className={styles.categoriesList}>
        {Object.entries(itemsByCategory).map(([category, items]) => (
          <li key={category}>
            <h2>{category}</h2>
            <ul
              className={`${styles.itemList} ${showDetails ? '' : styles.compactList}`}
            >
              {items?.map((item) => (
                <li
                  key={item.groupKey}
                  className={`${styles.item} ${showDetails ? '' : styles.compact}`}
                >
                  <Checkbox
                    label={
                      item.quantity
                        ? `${item.quantity} ${item.unit} ${item.name}`
                        : item.name
                    }
                    checked={item.purchased}
                    alignItems="start"
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
                    <Trash2 />
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
