import { ChangeEvent, RefObject, useEffect, useState } from 'react';

import styles from './MadeFilter.module.css';

interface MadeFilterProps {
  labelClassName?: string;
  updateActiveFilters: (filterName: string, isActive: boolean) => void;
  initialValue?: 'yes' | 'no';
  formRef: RefObject<HTMLFormElement | null>;
}

const options = [
  { value: 'all', label: 'All' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export default function MadeFilter({
  labelClassName,
  updateActiveFilters,
  initialValue,
  formRef,
}: MadeFilterProps) {
  const [selectedValue, setSelectedValue] = useState<
    'all' | 'yes' | 'no' | undefined
  >(initialValue);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as 'all' | 'yes' | 'no';
    setSelectedValue(value);
    updateActiveFilters('made', value !== 'all');
  };

  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const handleReset = () => {
      setSelectedValue(undefined);
      updateActiveFilters('made', false);
    };

    form.addEventListener('reset', handleReset);

    return () => {
      form.removeEventListener('reset', handleReset);
    };
  }, [formRef, updateActiveFilters]);

  return (
    <fieldset className={styles.container}>
      <legend className={labelClassName}>Recipes I made</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <div key={option.value} className={styles.option}>
            <input
              type="radio"
              id={option.value}
              name="made"
              value={option.value}
              checked={selectedValue === option.value}
              className={styles.input}
              onChange={handleChange}
            />
            <label htmlFor={option.value}>{option.label}</label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
