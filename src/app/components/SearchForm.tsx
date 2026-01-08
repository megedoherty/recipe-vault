'use client';

import Form from 'next/form';
import { useRouter, useSearchParams } from 'next/navigation';

import IngredientFilter from '@/app/components/IngredientFilter/IngredientFilter';
import Button from '@/components/atoms/Button/Button';
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

  const nameParam = searchParams.get('name');
  const name = typeof nameParam === 'string' ? nameParam : undefined;

  const categoryParam = searchParams.get('categoryId');
  const categoryId =
    typeof categoryParam === 'string' ? categoryParam : undefined;

  const includedIngredientsParam = searchParams.get('includedIngredients');
  const includedIngredients = includedIngredientsParam
    ? includedIngredientsParam.split(',')
    : [];

  const excludedIngredientsParam = searchParams.get('excludedIngredients');
  const excludedIngredients = excludedIngredientsParam
    ? excludedIngredientsParam.split(',')
    : [];

  const clearFilters = () => {
    router.replace('/');
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
