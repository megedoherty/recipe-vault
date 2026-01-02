import { InputHTMLAttributes } from 'react';

import styles from './TextInput.module.css';

interface TextInputProps extends InputHTMLAttributes<
  HTMLInputElement | HTMLTextAreaElement
> {
  label: string;
  name: string;
  id: string;
  type: 'text' | 'url' | 'textarea';
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
  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ''}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : ''}>
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          defaultValue={defaultValue}
          className={`${styles.textarea} ${fullWidth ? styles.fullWidth : ''}`}
          {...props}
        />
      ) : (
        <input
          type={type}
          id={id}
          name={name}
          defaultValue={defaultValue}
          className={`${fullWidth ? styles.fullWidth : ''}`}
          {...props}
        />
      )}
    </div>
  );
}
