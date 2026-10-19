import { InputHTMLAttributes, useId } from 'react';

import styles from './Switch.module.css';

interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'type' | 'role'
> {
  label: string;
  containerClassName?: string;
}

export default function Switch({
  label,
  containerClassName = '',
  ...props
}: SwitchProps) {
  const id = useId();

  return (
    <div className={`${containerClassName} ${styles.container}`}>
      <input
        type="checkbox"
        role="switch"
        {...props}
        id={id}
        className={styles.switch}
      />
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
    </div>
  );
}
