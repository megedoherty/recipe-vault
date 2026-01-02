'use client';

import Form from 'next/form';
import { useRouter, useSearchParams } from 'next/navigation';

import Button from '@/components/Button/Button';

import styles from './SearchForm.module.css';

export default function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nameParam = searchParams.get('name');
  const name = typeof nameParam === 'string' ? nameParam : undefined;

  return (
    <search>
      <Form action="/" className={styles.form}>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Search recipe name"
          defaultValue={name}
        />
        <label htmlFor="name" className="sr-only">
          Recipe name
        </label>
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
