import { InputHTMLAttributes } from 'react';

import styles from './Checkbox.module.css';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  sizeVariant: 'medium' | 'small';
  id: string;
  containerClassName?: string;
  checkboxClassName?: string;
}

export default function Checkbox({
  label,
  sizeVariant = 'medium',
  containerClassName = '',
  checkboxClassName = '',
  ...props
}: CheckboxProps) {
  return (
    <div
      className={`${containerClassName} ${styles.container} ${styles[sizeVariant]}`}
    >
      <input
        type="checkbox"
        {...props}
        className={`${styles.checkbox} ${checkboxClassName}`}
      />
      <label htmlFor={props.id} className={styles.label}>
        {label}
      </label>
    </div>
  );
}
