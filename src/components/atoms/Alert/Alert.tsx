import { ReactNode } from 'react';

import styles from './Alert.module.css';

interface AlertProps {
  children: ReactNode;
  /** Lets a field point at the alert with aria-describedby */
  id?: string;
  className?: string;
}

/**
 * A boxed error message, announced to screen readers. For form and field
 * validation and blocking errors; use a toast for background actions.
 *
 * Links inside are styled to match, so callers don't repeat link styles.
 */
export default function Alert({ children, id, className }: AlertProps) {
  return (
    <div
      id={id}
      role="alert"
      className={className ? `${styles.alert} ${className}` : styles.alert}
    >
      {children}
    </div>
  );
}
