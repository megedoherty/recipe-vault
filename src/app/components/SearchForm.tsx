'use client';

import Form from 'next/form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import TextInput from '@/components/atoms/TextInput/TextInput';
import CategorySelect from '@/components/molecules/CategorySelect/CategorySelect';
import SelectableSearchPopover from '@/components/molecules/SelectableSearchPopover/SelectableSearchPopover';
import { Category, IngredientCatalogEntryForSearch } from '@/types';

import styles from './SearchForm.module.css';

interface SearchFormProps {
  categories: Category[];
  ingredientCatalog: IngredientCatalogEntryForSearch[];
}

export default function SearchForm({
  categories,
  ingredientCatalog,
}: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nameParam = searchParams.get('name');
  const name = typeof nameParam === 'string' ? nameParam : undefined;

  const categoryParam = searchParams.get('categoryId');
  const categoryId =
    typeof categoryParam === 'string' ? categoryParam : undefined;

  const includedIngredientsParam = searchParams.get('includedIngredients');
  const [includedIngredients, setIncludedIngredients] = useState<string[]>(
    includedIngredientsParam ? includedIngredientsParam.split(',') : [],
  );

  const clearFilters = () => {
    setIncludedIngredients([]);
    router.replace('/');
  };

  const onToggleIncludedIngredients = (itemId: string) => {
    const ingredientInfo = ingredientCatalog.find((i) => i.id === itemId);

    setIncludedIngredients((prev) => {
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

  return (
    <search>
      <Form action="/" className={styles.form}>
        <TextInput
          label="Recipe name"
          type="text"
          id="recipeName"
          name="name"
          placeholder="Search recipe name"
          defaultValue={name}
          hideLabel
        />
        <CategorySelect
          categories={categories}
          showEmptyOption
          hideLabel
          defaultValue={categoryId}
        />
        <SelectableSearchPopover
          popoverId="ingredient-catalog-popover"
          popoverAriaLabel="Ingredient catalog"
          searchPlaceholder="Ingredient name"
          searchLabel="Ingredient name"
          searchId="ingredient-catalog-search"
          buttonText="Includes ingredients"
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
          getItemChecked={(itemId) => includedIngredients.includes(itemId)}
          onToggleItem={onToggleIncludedIngredients}
          canSelectMultiple
          getIndentationLevel={(item) => item.depth ?? 0}
        />
        {/* Hidden inputs to pass with form */}
        <input
          key="includedIngredients"
          type="hidden"
          name="includedIngredients"
          value={includedIngredients.join(',')}
        />
        <Button variant="primary" type="submit">
          Search
        </Button>
        <Button type="reset" variant="secondary" onClick={clearFilters}>
          Clear
        </Button>
      </Form>
    </search>
  );
}
