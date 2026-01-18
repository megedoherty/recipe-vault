'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import Select from '@/components/atoms/Select/Select';
import { PAGE_SIZE, sortOptions } from '@/constants';

import styles from './SortBar.module.css';

interface SortBarProps {
  count: number;
  page: number;
}

export default function SortBar({ count, page }: SortBarProps) {
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

    // Reset page to 1
    params.delete('page');

    router.replace(params.toString() ? `/?${params.toString()}` : '/');
  };

  const rangeStart = (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, count);

  const rangeText =
    rangeStart === rangeEnd
      ? `${rangeStart} of ${count} recipes`
      : `${rangeStart} - ${rangeEnd} of ${count} recipes`;

  return (
    <div className={styles.container}>
      <p>{rangeText}</p>
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
