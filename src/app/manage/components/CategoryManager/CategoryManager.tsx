'use client';

import { useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import PlusIcon from '@/components/atoms/icons/PlusIcon';
import { Category } from '@/types';

import CategoryEntry, {
  CategoryEntryType,
} from '../CategoryEntry/CategoryEntry';
import styles from './CategoryManager.module.css';

interface CategoryManagerProps {
  categories: Category[];
}

export default function CategoryManager({ categories }: CategoryManagerProps) {
  const [currentCategories, setCurrentCategories] =
    useState<CategoryEntryType[]>(categories);

  const addCategoryEntry = () => {
    setCurrentCategories((prev) => [
      ...prev,
      {
        id: crypto.getRandomValues(new Int8Array(1))[0], // temporary id
        name: '',
        isNew: true,
      },
    ]);
  };

  return (
    <section>
      <header className={styles.sectionHeader}>
        <h2>Categories</h2>
        <Button
          iconOnly
          onClick={addCategoryEntry}
          disabled={currentCategories.some((c) => c.isNew)}
        >
          <PlusIcon />
        </Button>
      </header>
      <ul className={styles.list}>
        {currentCategories.map((category) => (
          <CategoryEntry
            key={category.id}
            category={category}
            setCurrentCategories={setCurrentCategories}
          />
        ))}
      </ul>
    </section>
  );
}
