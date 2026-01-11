import { InputHTMLAttributes } from 'react';

import styles from './Checkbox.module.css';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  labelSize?: 'medium' | 'small';
  checkboxSize?: 'medium' | 'small';
  id: string;
  containerClassName?: string;
  checkboxClassName?: string;
  alignItems?: 'center' | 'start';
}

export default function Checkbox({
  label,
  labelSize = 'medium',
  checkboxSize = 'medium',
  containerClassName = '',
  checkboxClassName = '',
  alignItems = 'center',
  ...props
}: CheckboxProps) {
  return (
    <div
      className={`${containerClassName} ${styles.container} ${styles[checkboxSize]} ${styles[`align-${alignItems}`]}`}
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
