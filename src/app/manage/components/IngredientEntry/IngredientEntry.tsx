'use client';

import { Pencil, X } from 'lucide-react';
import {
  Dispatch,
  SetStateAction,
  useOptimistic,
  useState,
  useTransition,
} from 'react';

import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import LoadingSpinner from '@/components/atoms/LoadingSpinner/LoadingSpinner';
import Select from '@/components/atoms/Select/Select';
import { addIngredient, updateIngredient } from '@/lib/actions/ingredients';
import { IngredientDb } from '@/types';

import styles from './IngredientEntry.module.css';

export interface IngredientEntryType extends IngredientDb {
  isNew?: boolean;
}

interface IngredientEntryProps {
  ingredient: IngredientEntryType;
  parentOptions: { value: string; label: string }[];
  categories: string[];
  parentName?: string;
  setIngredients: Dispatch<SetStateAction<IngredientEntryType[]>>;
}

export default function IngredientEntry({
  ingredient,
  parentOptions,
  categories,
  parentName,
  setIngredients,
}: IngredientEntryProps) {
  const [isEditing, setIsEditing] = useState(!!ingredient.isNew);
  const [name, setName] = useState(ingredient.name);
  const [category, setCategory] = useState(ingredient.category);
  const [parentId, setParentId] = useState(ingredient.parentId);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const [optimistic, setOptimistic] = useOptimistic(
    ingredient,
    (current, next: Omit<IngredientDb, 'id'>) => ({ ...current, ...next }),
  );

  const categoryOptions = categories.map((c) => ({ value: c, label: c }));

  const cancelEdit = () => {
    if (ingredient.isNew) {
      setIngredients((prev) => prev.filter((i) => i.id !== ingredient.id));
    }
    setIsEditing(false);
    setError('');
    setName(ingredient.name);
    setCategory(ingredient.category);
    setParentId(ingredient.parentId);
  };

  const saveEdit = () => {
    const input = { name: name.trim(), category, parentId };
    if (!input.name || !input.category) {
      setError('Name and category are required');
      return;
    }

    setError('');
    startTransition(async () => {
      try {
        setOptimistic(input);
        if (ingredient.isNew) {
          const tempId = ingredient.id;
          const saved = await addIngredient(input);
          setIngredients((prev) =>
            prev.map((i) => (i.id === tempId ? { ...saved, isNew: false } : i)),
          );
        } else {
          await updateIngredient(ingredient.id, input);
          setIngredients((prev) =>
            prev.map((i) => (i.id === ingredient.id ? { ...i, ...input } : i)),
          );
        }
      } catch (e) {
        console.error('Failed to save ingredient:', e);
        setError('Could not save. It may already exist.');
        setIsEditing(true);
      }
    });

    setIsEditing(false);
  };

  return (
    <li className={styles.item}>
      {isEditing ? (
        <>
          <div className={styles.fields}>
            <Input
              name="name"
              label="Name"
              placeholder="Ingredient Name"
              id={`ingredient-name-${ingredient.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              fullWidth
              hideLabel
            />
            <Select
              name="parent"
              label="Parent"
              id={`ingredient-parent-${ingredient.id}`}
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              options={parentOptions}
              emptyOption={{ value: '', label: 'No parent' }}
            />
            <Select
              name="category"
              label="Category"
              id={`ingredient-category-${ingredient.id}`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categoryOptions}
              emptyOption={{ value: '', label: 'Select a category' }}
            />
          </div>
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
              <X />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div>
            <p className={styles.name}>
              {optimistic.name}
              {isPending ? <LoadingSpinner size="small" /> : ''}
            </p>
            <p className={styles.meta}>
              {optimistic.category}
              {parentName ? ` · child of ${parentName}` : ''}
            </p>
          </div>
          <Button
            iconOnly
            size="small"
            onClick={() => setIsEditing(true)}
            aria-label="Edit"
          >
            <Pencil />
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </li>
  );
}
