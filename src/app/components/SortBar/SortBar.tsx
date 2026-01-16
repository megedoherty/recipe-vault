'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import Select from '@/components/atoms/Select/Select';
import { sortOptions } from '@/constants';

import styles from './SortBar.module.css';

interface SortBarProps {
  count: number;
}

export default function SortBar({ count }: SortBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get('sort') || sortOptions[0].value;

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (newSort === sortOptions[0].value) {
      // Remove sort param if it's the default
      params.delete('sort');
    } else {
      params.set('sort', newSort);
    }

    router.replace(params.toString() ? `/?${params.toString()}` : '/');
  };

  return (
    <div className={styles.container}>
      <p>
        {count} {count === 1 ? 'recipe' : 'recipes'} found
      </p>
      <Select
        options={sortOptions}
        label="Sort by"
        name="sort"
        value={currentSort}
        onChange={handleSortChange}
        id="sort"
      />
    </div>
  );
}
