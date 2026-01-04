import styles from './Select.module.css';

interface SelectProps {
  label: string;
  name: string;
  id: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  emptyOption?: { value: string; label: string };
  hideLabel?: boolean;
}

export default function Select({
  label,
  name,
  id,
  defaultValue,
  options,
  emptyOption,
  hideLabel = false,
}: SelectProps) {
  return (
    <div className={styles.container}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : ''}>
        {label}
      </label>
      <select
        name={name}
        id={id}
        defaultValue={defaultValue}
        className={styles.select}
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
