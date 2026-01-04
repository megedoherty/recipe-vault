import { InputHTMLAttributes } from 'react';

import styles from './TextInput.module.css';

interface TextInputProps extends InputHTMLAttributes<
  HTMLInputElement | HTMLTextAreaElement
> {
  label: string;
  name: string;
  id: string;
  type: 'text' | 'url' | 'textarea' | 'email' | 'password';
  defaultValue?: string;
  fullWidth?: boolean;
  hideLabel?: boolean;
}

export default function TextInput({
  label,
  name,
  id,
  type,
  defaultValue,
  fullWidth,
  hideLabel,
  ...props
}: TextInputProps) {
  const fullWidthClass = fullWidth ? styles.fullWidth : '';

  return (
    <div className={`${styles.container} ${fullWidthClass}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : ''}>
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          defaultValue={defaultValue}
          className={`${styles.textarea} ${fullWidthClass}`}
          {...props}
        />
      ) : (
        <input
          type={type}
          id={id}
          name={name}
          defaultValue={defaultValue}
          className={`${styles.input} ${fullWidthClass}`}
          {...props}
        />
      )}
    </div>
  );
}
