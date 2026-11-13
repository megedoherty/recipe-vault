import { InputHTMLAttributes } from 'react';

import styles from './Input.module.css';

interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
  'className'
> {
  label: string;
  name: string;
  id: string;
  type: 'text' | 'url' | 'textarea' | 'email' | 'password' | 'number';
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

  const isCredentialField = type === 'email' || type === 'password';
  const passwordManagerProps = isCredentialField
    ? {}
    : {
        autoComplete: 'off',
        'data-lpignore': 'true',
        'data-1p-ignore': true,
        'data-bwignore': true,
      };

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
          className={`${styles.textarea} ${sharedClasses}`}
          {...passwordManagerProps}
          {...props}
        />
      ) : (
        <input
          type={type}
          id={id}
          name={name}
          className={`${styles.input} ${sharedClasses}`}
          {...passwordManagerProps}
          {...props}
        />
      )}
    </div>
  );
}
