import { InputHTMLAttributes, useId } from 'react';

import styles from './Checkbox.module.css';

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id'
> {
  label: string;
  labelSize?: 'medium' | 'small';
  checkboxSize?: 'medium' | 'small';
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
  const id = useId();

  return (
    <div
      className={`${containerClassName} ${styles.container} ${styles[checkboxSize]} ${styles[`align-${alignItems}`]}`}
    >
      <input
        type="checkbox"
        {...props}
        id={id}
        className={`${styles.checkbox} ${checkboxClassName}`}
      />
      <label htmlFor={id} className={`${styles.label} ${styles[labelSize]}`}>
        {label}
      </label>
    </div>
  );
}
