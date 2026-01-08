'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useRef, useTransition } from 'react';

import IngredientFilter from '@/app/components/IngredientFilter/IngredientFilter';
import Button from '@/components/atoms/Button/Button';
import LoadingSpinner from '@/components/atoms/LoadingSpinner/LoadingSpinner';
import TextInput from '@/components/atoms/TextInput/TextInput';
import CategorySelect from '@/components/molecules/CategorySelect/CategorySelect';
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
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isClearing, startClearTransition] = useTransition();

  const nameParam = searchParams.get('name');
  const name = typeof nameParam === 'string' ? nameParam : undefined;

  const categoryParam = searchParams.get('categoryId');
  const categoryId = typeof categoryParam === 'string' ? categoryParam : '';

  const includedIngredientsParam = searchParams.get('includedIngredients');
  const includedIngredients = includedIngredientsParam
    ? includedIngredientsParam.split(',')
    : [];

  const excludedIngredientsParam = searchParams.get('excludedIngredients');
  const excludedIngredients = excludedIngredientsParam
    ? excludedIngredientsParam.split(',')
    : [];

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const params = new URLSearchParams();

    const nameValue = formData.get('name') as string;
    if (nameValue?.trim()) {
      params.set('name', nameValue.trim());
    }

    const categoryValue = formData.get('categoryId') as string;
    if (categoryValue) {
      params.set('categoryId', categoryValue);
    }

    const includedValue = formData.get('includedIngredients') as string;
    if (includedValue) {
      params.set('includedIngredients', includedValue);
    }

    const excludedValue = formData.get('excludedIngredients') as string;
    if (excludedValue) {
      params.set('excludedIngredients', excludedValue);
    }

    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `/?${queryString}` : '/');
    });
  };

  const clearFilters = () => {
    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    const isEmpty = Array.from(formData.values()).every(
      (value) => value === '',
    );

    if (!isEmpty) {
      startClearTransition(() => {
        router.replace('/');
      });
      formRef.current?.reset();
    }
  };

  return (
    <search>
      <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
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
        <IngredientFilter
          key={`included-${includedIngredientsParam || ''}`}
          type="Included"
          ingredientCatalog={ingredientCatalog}
          initialValue={includedIngredients}
          buttonClassName={styles.selectableSearchPopoverButton}
        />
        <IngredientFilter
          key={`excluded-${excludedIngredientsParam || ''}`}
          type="Excluded"
          ingredientCatalog={ingredientCatalog}
          initialValue={excludedIngredients}
          buttonClassName={styles.selectableSearchPopoverButton}
        />
        <Button
          variant="primary"
          type="submit"
          disabled={isPending}
          className={styles.searchButton}
        >
          {isPending ? (
            <>
              Search
              <LoadingSpinner size="small" />
            </>
          ) : (
            'Search'
          )}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={clearFilters}
          disabled={isClearing}
          className={styles.clearButton}
        >
          {isClearing ? (
            <>
              Clear
              <LoadingSpinner size="small" />
            </>
          ) : (
            'Clear'
          )}
        </Button>
      </form>
    </search>
  );
}
