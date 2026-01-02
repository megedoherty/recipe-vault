'use client';

import Form from 'next/form';
import { useRouter, useSearchParams } from 'next/navigation';

import Button from '@/components/Button/Button.component';

import styles from './SearchForm.module.css';

export default function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const termParam = searchParams.get('term');
  const term = typeof termParam === 'string' ? termParam : undefined;

  return (
    <search>
      <Form action="/" className={styles.form}>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Search recipe name"
          defaultValue={term}
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
