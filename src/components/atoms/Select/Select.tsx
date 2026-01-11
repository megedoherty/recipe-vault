import { SelectHTMLAttributes } from 'react';

import styles from './Select.module.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  id: string;
  options: { value: string; label: string }[];
  emptyOption?: { value: string; label: string };
  hideLabel?: boolean;
  direction?: 'horizontal' | 'vertical';
  labelClassName?: string;
}

export default function Select({
  label,
  name,
  id,
  onChange,
  options,
  emptyOption,
  hideLabel = false,
  direction = 'horizontal',
  labelClassName = '',
  ...rest
}: SelectProps) {
  return (
    <div className={`${styles.container} ${styles[direction]}`}>
      <label
        htmlFor={id}
        className={`${hideLabel ? 'sr-only' : ''} ${labelClassName}`}
      >
        {label}
      </label>
      <select
        name={name}
        id={id}
        onChange={onChange}
        className={styles.select}
        {...rest}
      >
        {emptyOption && (
          <option value={emptyOption.value}>{emptyOption.label}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
