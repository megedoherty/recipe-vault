'use client';

import { useEffect, useState } from 'react';

import SelectableSearchPopover from '@/components/molecules/SelectableSearchPopover/SelectableSearchPopover';
import { IngredientForSearch } from '@/types';

interface IngredientFilterProps {
  // The type of filter (Include or Exclude ingredients)
  type: 'Include' | 'Exclude';
  // All the ingredients to display in the popover
  ingredients: IngredientForSearch[];
  // The initial value of the filter
  initialValue?: string[];
  // The class name for the button that opens the popover
  buttonClassName?: string;
  // Lets the parent component know when this filter has active selections
  updateActiveFilters?: (filterName: string, isActive: boolean) => void;
}

export default function IngredientFilter({
  type,
  ingredients,
  initialValue = [],
  buttonClassName,
  updateActiveFilters,
}: IngredientFilterProps) {
  const [selectedIngredients, setSelectedIngredients] =
    useState<string[]>(initialValue);

  useEffect(() => {
    setSelectedIngredients(initialValue);
  }, [initialValue]);

  const onToggleIngredient = (itemId: string) => {
    const ingredientInfo = ingredients.find((i) => i.id === itemId);

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

  useEffect(() => {
    if (updateActiveFilters) {
      updateActiveFilters(inputName, selectedIngredients.length > 0);
    }
  }, [selectedIngredients.length, updateActiveFilters, inputName]);

  return (
    <>
      <SelectableSearchPopover
        popoverId={popoverId}
        popoverAriaLabel="Ingredient filter"
        searchPlaceholder="Ingredient name"
        searchLabel="Ingredient name"
        searchId={searchId}
        buttonContent={`${buttonTextPrefix}${selectedIngredients.length > 0 ? ` (${selectedIngredients.length})` : ''}`}
        buttonClassName={buttonClassName}
        buttonSize="medium"
        noResultsText="No ingredients found"
        items={ingredients}
        groupItems={(items) => {
          const grouped = Object.groupBy(
            items,
            (ingredient) => ingredient.category || '',
          );
          return grouped as Record<string, IngredientForSearch[]>;
        }}
        getItemLabel={(item) => item.name}
        getItemChecked={(itemId) => selectedIngredients.includes(itemId)}
        onToggleItem={onToggleIngredient}
        canSelectMultiple
        getIndentationLevel={(item) => item.depth ?? 0}
        openDirection="left"
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
