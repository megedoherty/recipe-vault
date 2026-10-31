'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import { IngredientDb } from '@/types';

import IngredientEntry, {
  IngredientEntryType,
} from '../IngredientEntry/IngredientEntry';
import styles from './IngredientManager.module.css';

interface IngredientManagerProps {
  ingredients: IngredientDb[];
  categories: string[];
}

/** Ids of `id` itself and everything below it in the ingredient tree. */
function getSubtreeIds(id: string, ingredients: IngredientDb[]): Set<string> {
  const ids = new Set([id]);
  let added = true;
  while (added) {
    added = false;
    for (const i of ingredients) {
      if (!ids.has(i.id) && ids.has(i.parentId)) {
        ids.add(i.id);
        added = true;
      }
    }
  }
  return ids;
}

export default function IngredientManager({
  ingredients,
  categories,
}: IngredientManagerProps) {
  const [current, setCurrent] = useState<IngredientEntryType[]>(ingredients);
  const [search, setSearch] = useState('');

  const addNewEntry = () => {
    setCurrent((prev) => [
      {
        id: `new-${crypto.randomUUID()}`,
        name: '',
        category: '',
        parentId: '',
        isNew: true,
      },
      ...prev,
    ]);
  };

  const saved = current.filter((i) => !i.isNew);
  const namesById = new Map(saved.map((i) => [i.id, i.name]));
  const term = search.trim().toLowerCase();
  // Always keep the entry being added visible, even if it doesn't match
  const visible = current.filter(
    (i) => i.isNew || i.name.toLowerCase().includes(term),
  );

  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2>Ingredients</h2>
        <Button
          iconOnly
          onClick={addNewEntry}
          disabled={current.some((i) => i.isNew)}
          aria-label="Add Ingredient"
        >
          <Plus />
        </Button>
      </header>
      <Input
        name="search"
        label="Search ingredients"
        placeholder="Search ingredients"
        id="ingredient-search"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        hideLabel
      />
      <ul className={styles.list}>
        {visible.length === 0 && <li>No ingredients found</li>}
        {visible.map((ingredient) => {
          const excluded = getSubtreeIds(ingredient.id, saved);
          return (
            <IngredientEntry
              key={ingredient.id}
              ingredient={ingredient}
              parentOptions={saved
                .filter((i) => !excluded.has(i.id))
                .map((i) => ({ value: i.id, label: i.name }))}
              categories={categories}
              parentName={namesById.get(ingredient.parentId)}
              setIngredients={setCurrent}
            />
          );
        })}
      </ul>
    </section>
  );
}
