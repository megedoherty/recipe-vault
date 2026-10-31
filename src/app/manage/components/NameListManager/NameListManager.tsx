'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/atoms/Button/Button';

import NameEntry, { NameEntryType } from '../NameEntry/NameEntry';
import styles from './NameListManager.module.css';

interface NameListManagerProps {
  title: string;
  placeholder: string;
  entries: { id: number; name: string }[];
  addEntry: (name: string) => Promise<{ id: number; name: string } | null>;
  updateEntry: (id: number, name: string) => Promise<void>;
}

export default function NameListManager({
  title,
  placeholder,
  entries,
  addEntry,
  updateEntry,
}: NameListManagerProps) {
  const [currentEntries, setCurrentEntries] =
    useState<NameEntryType[]>(entries);

  const addNewEntry = () => {
    setCurrentEntries((prev) => [
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
        <h2>{title}</h2>
        <Button
          iconOnly
          onClick={addNewEntry}
          disabled={currentEntries.some((e) => e.isNew)}
          aria-label={`Add ${title}`}
        >
          <Plus />
        </Button>
      </header>
      <ul className={styles.list}>
        {currentEntries.map((entry) => (
          <NameEntry
            key={entry.id}
            entry={entry}
            placeholder={placeholder}
            addEntry={addEntry}
            updateEntry={updateEntry}
            setEntries={setCurrentEntries}
          />
        ))}
      </ul>
    </section>
  );
}
