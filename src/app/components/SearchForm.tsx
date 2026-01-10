'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useRef, useTransition } from 'react';

import IngredientFilter from '@/app/components/IngredientFilter/IngredientFilter';
import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import LoadingSpinner from '@/components/atoms/LoadingSpinner/LoadingSpinner';
import CategorySelect from '@/components/molecules/CategorySelect/CategorySelect';
import {
  Category,
  Equipment,
  IngredientForSearch,
  ServingsRange,
} from '@/types';

import SearchFiltersModal from './SearchFiltersModal/SearchFiltersModal';
import styles from './SearchForm.module.css';
import {
  generateQueryString,
  getNumberSearchParam,
  getStringArraySearchParam,
  getStringSearchParam,
} from './utils';

interface SearchFormProps {
  categories: Category[];
  ingredients: IngredientForSearch[];
  equipment: Equipment[];
  servingsRange: ServingsRange;
}

export default function SearchForm({
  categories,
  ingredients,
  equipment,
  servingsRange,
}: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isClearing, startClearTransition] = useTransition();

  const name = getStringSearchParam(searchParams, 'name');
  const categoryId = getStringSearchParam(searchParams, 'categoryId');
  const made = getStringSearchParam(searchParams, 'made');
  let madeValue: 'yes' | 'no' | undefined = undefined;
  if (made === 'true') {
    madeValue = 'yes';
  } else if (made === 'false') {
    madeValue = 'no';
  }
  const minServings = getNumberSearchParam(searchParams, 'minServings');
  const maxServings = getNumberSearchParam(searchParams, 'maxServings');
  const includeIngredients = getStringArraySearchParam(
    searchParams,
    'includeIngredients',
  );
  const excludeIngredients = getStringArraySearchParam(
    searchParams,
    'excludeIngredients',
  );
  const equipmentIds = getStringArraySearchParam(searchParams, 'equipment');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const queryString = generateQueryString(e);
    if (queryString !== searchParams.toString()) {
      startTransition(() => {
        router.replace(queryString ? `/?${queryString}` : '/');
      });
    }
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
      // Only redirect if there are search params
      if (searchParams.toString() !== '') {
        startClearTransition(() => {
          router.replace('/');
        });
      }

      formRef.current?.reset();
    }
  };

  return (
    <search>
      <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
        <Input
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
          key={`include-${includeIngredients.join(',')}`}
          type="Include"
          ingredients={ingredients}
          initialValue={includeIngredients}
          buttonClassName={styles.ingredientFilterButton}
        />
        <SearchFiltersModal
          ingredients={ingredients}
          equipment={equipment}
          madeInitialValue={madeValue}
          excludeIngredientsInitialValue={excludeIngredients}
          equipmentIdsInitialValue={equipmentIds}
          minServingsInitialValue={minServings ?? undefined}
          maxServingsInitialValue={maxServings ?? undefined}
          servingsRange={servingsRange}
          formRef={formRef}
        />
        <div className={styles.buttonsContainer}>
          <Button
            variant="primary"
            type="submit"
            disabled={isPending}
            className={styles.searchButton}
          >
            <>
              Search
              {isPending && <LoadingSpinner size="small" />}
            </>
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={clearFilters}
            disabled={isClearing}
            className={styles.clearButton}
          >
            <>
              Clear
              {isClearing && <LoadingSpinner size="small" />}
            </>
          </Button>
        </div>
      </form>
    </search>
  );
}
