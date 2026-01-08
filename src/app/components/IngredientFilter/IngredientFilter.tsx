'use client';

import { useState } from 'react';

import SelectableSearchPopover from '@/components/molecules/SelectableSearchPopover/SelectableSearchPopover';
import { IngredientCatalogEntryForSearch } from '@/types';

interface IngredientFilterProps {
  type: 'Included' | 'Excluded';
  ingredientCatalog: IngredientCatalogEntryForSearch[];
  initialValue?: string[];
  buttonClassName?: string;
}

export default function IngredientFilter({
  type,
  ingredientCatalog,
  initialValue = [],
  buttonClassName,
}: IngredientFilterProps) {
  const [selectedIngredients, setSelectedIngredients] =
    useState<string[]>(initialValue);

  const onToggleIngredient = (itemId: string) => {
    const ingredientInfo = ingredientCatalog.find((i) => i.id === itemId);

    setSelectedIngredients((prev) => {
      if (prev.includes(itemId)) {
        // Unchecking: remove the item, its children, and all ancestors
        const idsToRemove = new Set([
          itemId,
          ...(ingredientInfo?.childrenIds ?? []),
          ...(ingredientInfo?.parentIds ?? []),
        ]);
        return prev.filter((id) => !idsToRemove.has(id));
      } else {
        // Checking: add the item and its descendants
        return [...prev, itemId, ...(ingredientInfo?.childrenIds ?? [])];
      }
    });
  };

  const inputName = `${type.toLowerCase()}Ingredients`;
  const buttonTextPrefix = `${type} Ingredients`;
  const popoverId = `${type}-ingredients-popover`;
  const searchId = `${type}-ingredients-search`;

  return (
    <>
      <SelectableSearchPopover
        popoverId={popoverId}
        popoverAriaLabel="Ingredient catalog"
        searchPlaceholder="Ingredient name"
        searchLabel="Ingredient name"
        searchId={searchId}
        buttonText={`${buttonTextPrefix}${selectedIngredients.length > 0 ? ` (${selectedIngredients.length})` : ''}`}
        buttonClassName={buttonClassName}
        buttonSize="medium"
        noResultsText="No ingredients found"
        items={ingredientCatalog}
        groupItems={(items) => {
          const grouped = Object.groupBy(
            items,
            (ingredient) => ingredient.category || '',
          );
          return grouped as Record<string, IngredientCatalogEntryForSearch[]>;
        }}
        getItemLabel={(item) => item.name}
        getItemChecked={(itemId) => selectedIngredients.includes(itemId)}
        onToggleItem={onToggleIngredient}
        canSelectMultiple
        getIndentationLevel={(item) => item.depth ?? 0}
      />
      <input
        key={inputName}
        type="hidden"
        name={inputName}
        value={selectedIngredients.join(',')}
      />
    </>
  );
}
