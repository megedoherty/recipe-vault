'use client';

import Form from 'next/form';
import { useRouter, useSearchParams } from 'next/navigation';

import Button from '@/components/atoms/Button/Button';
import TextInput from '@/components/atoms/TextInput/TextInput';
import CategorySelect from '@/components/molecules/CategorySelect/CategorySelect';
import { Category } from '@/types';

import styles from './SearchForm.module.css';

interface SearchFormProps {
  categories: Category[];
}

export default function SearchForm({ categories }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nameParam = searchParams.get('name');
  const name = typeof nameParam === 'string' ? nameParam : undefined;

  const categoryParam = searchParams.get('categoryId');
  const categoryId =
    typeof categoryParam === 'string' ? categoryParam : undefined;

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
        <Button variant="primary" type="submit">
          Search
        </Button>
        <Button
          type="reset"
          variant="secondary"
          onClick={() => router.replace('/')}
        >
          Clear
        </Button>
      </Form>
    </search>
  );
}
