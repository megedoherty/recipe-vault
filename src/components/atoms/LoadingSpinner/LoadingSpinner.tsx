import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  isCentered?: boolean;
  label?: string;
}

export default function LoadingSpinner({
  size = 'medium',
  isCentered = false,
  label = 'Loading',
}: LoadingSpinnerProps) {
  const classes = [
    styles.spinner,
    size === 'small' && styles.small,
    size === 'medium' && styles.medium,
    size === 'large' && styles.large,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`${styles.container} ${isCentered ? styles.centered : ''}`}
      role="status"
    >
      <span className={classes} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
