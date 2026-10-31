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

import styles from './NameEntry.module.css';

export interface NameEntryType {
  id: number;
  name: string;
  isNew?: boolean;
}

interface NameEntryProps {
  entry: NameEntryType;
  placeholder: string;
  addEntry: (name: string) => Promise<{ id: number; name: string } | null>;
  updateEntry: (id: number, name: string) => Promise<void>;
  setEntries: Dispatch<SetStateAction<NameEntryType[]>>;
}

export default function NameEntry({
  entry,
  placeholder,
  addEntry,
  updateEntry,
  setEntries,
}: NameEntryProps) {
  const [isEditing, setIsEditing] = useState(!!entry.isNew);
  const [name, setName] = useState(entry.name);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const [optimisticEntry, setOptimisticEntry] = useOptimistic(
    entry,
    (current, newName: string) => ({ ...current, name: newName }),
  );

  const cancelEdit = () => {
    if (entry.isNew) {
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }
    setIsEditing(false);
    setError('');
    setName(entry.name);
  };

  const saveEdit = () => {
    const newName = name.trim();
    if (!newName) {
      setError('Name is required');
      return;
    }

    setError('');
    startTransition(async () => {
      try {
        setOptimisticEntry(newName);
        if (entry.isNew) {
          const tempId = entry.id;

          const saved = await addEntry(newName);
          if (saved) {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === tempId ? { ...saved, isNew: false } : e,
              ),
            );
          }
        } else {
          await updateEntry(entry.id, newName);
        }
      } catch (e) {
        console.error('Failed to save:', e);
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
          <Input
            name="name"
            label="Name"
            placeholder={placeholder}
            id={`name-${entry.id}`}
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
              <X />
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.name}>
            {optimisticEntry.name}
            {isPending ? <LoadingSpinner size="small" /> : ''}
          </p>
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
