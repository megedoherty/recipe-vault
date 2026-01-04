import { InputHTMLAttributes } from 'react';

import styles from './Checkbox.module.css';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  labelSize?: 'medium' | 'small';
  checkboxSize?: 'medium' | 'small';
  id: string;
  containerClassName?: string;
  checkboxClassName?: string;
}

export default function Checkbox({
  label,
  labelSize = 'medium',
  checkboxSize = 'medium',
  containerClassName = '',
  checkboxClassName = '',
  ...props
}: CheckboxProps) {
  return (
    <div
      className={`${containerClassName} ${styles.container} ${styles[checkboxSize]}`}
    >
      <input
        type="checkbox"
        {...props}
        className={`${styles.checkbox} ${checkboxClassName}`}
      />
      <label
        htmlFor={props.id}
        className={`${styles.label} ${styles[labelSize]}`}
      >
        {label}
      </label>
    </div>
  );
}
