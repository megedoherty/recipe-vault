import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  isCentered?: boolean;
}

export default function LoadingSpinner({
  size = 'medium',
  isCentered = false,
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
    <div className={`${styles.container} ${isCentered ? styles.centered : ''}`}>
      <span className={classes} />
    </div>
  );
}
