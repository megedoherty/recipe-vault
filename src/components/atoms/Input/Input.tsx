import { InputHTMLAttributes } from 'react';

import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<
  HTMLInputElement | HTMLTextAreaElement
> {
  label: string;
  name: string;
  id: string;
  type: 'text' | 'url' | 'textarea' | 'email' | 'password' | 'number';
  defaultValue?: string | number;
  fullWidth?: boolean;
  hideLabel?: boolean;
  className?: string;
  hasError?: boolean;
}

export default function Input({
  label,
  name,
  id,
  type,
  defaultValue,
  fullWidth,
  hideLabel,
  className = '',
  hasError,
  ...props
}: InputProps) {
  const fullWidthClass = fullWidth ? styles.fullWidth : '';
  const errorClass = hasError ? styles.error : '';

  const sharedClasses = `${fullWidthClass} ${errorClass}`;

  return (
    <div className={`${styles.container} ${fullWidthClass} ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : ''}>
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          defaultValue={defaultValue}
          className={`${styles.textarea} ${sharedClasses}`}
          {...props}
        />
      ) : (
        <input
          type={type}
          id={id}
          name={name}
          defaultValue={defaultValue}
          className={`${styles.input} ${sharedClasses}`}
          {...props}
        />
      )}
    </div>
  );
}
