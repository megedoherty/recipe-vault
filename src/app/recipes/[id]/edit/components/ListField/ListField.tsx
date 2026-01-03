import { SetStateAction } from 'react';

import Button from '@/components/Button/Button';
import Hint from '@/components/Hint/Hint';
import PlusIcon from '@/components/icons/PlusIcon';
import XIcon from '@/components/icons/XIcon';

import styles from './ListField.module.css';

interface ListFieldProps {
  heading: string;
  items: string[];
  setItems: (value: SetStateAction<string[]>) => void;
  itemLabel: string;
  extraInfo?: string;
  fieldType: 'input' | 'textarea';
}

export default function ListField({
  heading,
  items,
  setItems,
  itemLabel,
  extraInfo,
  fieldType,
}: ListFieldProps) {
  const handleAddItem = () => {
    setItems((prev) => [...prev, '']);
  };

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      <div>
        <h2>{heading}</h2>
        {extraInfo && <Hint>{extraInfo}</Hint>}
      </div>
      {items.map((item, index) => (
        <div key={item || index} className={styles.item}>
          {fieldType === 'input' ? (
            <input
              type="text"
              name={itemLabel}
              id={`${itemLabel}-${index}`}
              defaultValue={item}
              className={styles.input}
            />
          ) : (
            <textarea
              name={itemLabel}
              id={`${itemLabel}-${index}`}
              defaultValue={item}
              className={styles.textarea}
            />
          )}
          <label htmlFor={`${itemLabel}-${index}`} className="sr-only">
            {itemLabel} {index + 1}
          </label>
          <Button
            variant="secondary"
            iconOnly
            size="small"
            onClick={() => handleDeleteItem(index)}
            aria-label={`Delete ${itemLabel}`}
          >
            <XIcon />
          </Button>
        </div>
      ))}
      <Button onClick={handleAddItem} size="small" className={styles.addButton}>
        <PlusIcon /> Add {itemLabel}
      </Button>
    </div>
  );
}
