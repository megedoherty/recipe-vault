'use client';

import {
  Dispatch,
  SetStateAction,
  useOptimistic,
  useState,
  useTransition,
} from 'react';

import Button from '@/components/atoms/Button/Button';
import EditIcon from '@/components/atoms/icons/EditIcon';
import XIcon from '@/components/atoms/icons/XIcon';
import Input from '@/components/atoms/Input/Input';
import LoadingSpinner from '@/components/atoms/LoadingSpinner/LoadingSpinner';
import { addCategory, updateCategory } from '@/lib/actions/categories';
import { Category } from '@/types';

import styles from './CategoryEntry.module.css';

export interface CategoryEntryType extends Category {
  isNew?: boolean;
}

interface CategoryEntryProps {
  category: CategoryEntryType;
  setCurrentCategories: Dispatch<SetStateAction<CategoryEntryType[]>>;
}

export default function CategoryEntry({
  category,
  setCurrentCategories,
}: CategoryEntryProps) {
  const [isEditing, setIsEditing] = useState(category.isNew ? true : false);
  const [name, setName] = useState(category.name);
  const [isPending, startTransition] = useTransition();

  const [optimisticCategory, setOptimisticCategory] = useOptimistic(
    category,
    (currentCategory, newName: string) => ({
      ...currentCategory,
      name: newName,
    }),
  );

  const cancelEdit = () => {
    if (category.isNew) {
      setCurrentCategories((prev) => prev.filter((c) => c.id !== category.id));
    }
    setIsEditing(false);
    setName(category.name);
  };

  const saveEdit = () => {
    const newName = name;
    startTransition(async () => {
      try {
        setOptimisticCategory(newName);
        if (category.isNew) {
          const tempId = category.id;

          const savedCategory = await addCategory(newName);
          if (savedCategory) {
            setCurrentCategories((prev) =>
              prev.map((c) =>
                c.id === tempId ? { ...savedCategory, isNew: false } : c,
              ),
            );
          }
        } else {
          await updateCategory(category.id, newName);
        }
      } catch (error) {
        console.error('Failed to update category:', error);
      }
    });

    setIsEditing(false);
  };

  return (
    <li className={styles.item}>
      {isEditing ? (
        <>
          <Input
            name="name"
            label="Name"
            placeholder="Category Name"
            id={`name-${category.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            fullWidth
            hideLabel
          />
          <div className={styles.editButtons}>
            <Button iconOnly onClick={saveEdit} aria-label="Save">
              ✔
            </Button>
            <Button
              iconOnly
              variant="secondary"
              onClick={cancelEdit}
              aria-label="Cancel"
            >
              <XIcon />
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.name}>
            {optimisticCategory.name}
            {isPending ? <LoadingSpinner size="small" /> : ''}
          </p>
          <Button iconOnly size="small" onClick={() => setIsEditing(true)}>
            <EditIcon />
          </Button>
        </>
      )}
    </li>
  );
}
