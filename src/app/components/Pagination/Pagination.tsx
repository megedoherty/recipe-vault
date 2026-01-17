'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import Button from '@/components/atoms/Button/Button';

import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({
  currentPage,
  totalPages,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onClick = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    router.replace(params.toString() ? `/?${params.toString()}` : '/');
  };

  return (
    <div className={styles.container}>
      {currentPage > 1 && (
        <Button
          className={styles.prevButton}
          variant="secondary"
          onClick={() => onClick(currentPage - 1)}
        >
          Previous
        </Button>
      )}
      {currentPage < totalPages && (
        <Button
          className={styles.nextButton}
          variant="secondary"
          onClick={() => onClick(currentPage + 1)}
        >
          Next
        </Button>
      )}
    </div>
  );
}
