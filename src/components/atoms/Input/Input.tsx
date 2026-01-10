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
  containerClassName?: string;
  inputClassName?: string;
  hasError?: boolean;
  direction?: 'horizontal' | 'vertical';
}

export default function Input({
  label,
  name,
  id,
  type,
  defaultValue,
  fullWidth,
  hideLabel,
  containerClassName = '',
  inputClassName = '',
  hasError,
  direction = 'vertical',
  ...props
}: InputProps) {
  const fullWidthClass = fullWidth ? styles.fullWidth : '';
  const errorClass = hasError ? styles.error : '';

  const sharedClasses =
    `${fullWidthClass} ${errorClass} ${inputClassName}`.trim();

  return (
    <div
      className={`${styles.container} ${fullWidthClass} ${containerClassName} ${styles[direction]}`}
    >
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
