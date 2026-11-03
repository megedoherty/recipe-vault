import { SelectHTMLAttributes } from 'react';

import styles from './Select.module.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  id: string;
  // Options sharing a `group` are rendered together under an <optgroup>
  options: readonly { value: string; label: string; group?: string }[];
  emptyOption?: { value: string; label: string };
  hideLabel?: boolean;
  direction?: 'horizontal' | 'vertical';
  labelClassName?: string;
  selectClassName?: string;
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
  selectClassName = '',
  ...rest
}: SelectProps) {
  // Group consecutive-or-not options by their group, keeping first-seen order
  const groups: {
    label?: string;
    options: SelectProps['options'][number][];
  }[] = [];
  for (const option of options) {
    const existing = groups.find((group) => group.label === option.group);
    if (existing) existing.options.push(option);
    else groups.push({ label: option.group, options: [option] });
  }

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
        className={`${styles.select} ${selectClassName}`}
        {...rest}
      >
        {emptyOption && (
          <option value={emptyOption.value}>{emptyOption.label}</option>
        )}
        {groups.map(({ label: groupLabel, options: groupOptions }) => {
          const optionElements = groupOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ));
          return groupLabel ? (
            <optgroup key={groupLabel} label={groupLabel}>
              {optionElements}
            </optgroup>
          ) : (
            optionElements
          );
        })}
      </select>
    </div>
  );
}
