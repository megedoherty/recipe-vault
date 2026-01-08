import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({
  size = 'medium',
}: LoadingSpinnerProps) {
  const classes = [
    styles.spinner,
    size === 'small' && styles.small,
    size === 'medium' && styles.medium,
    size === 'large' && styles.large,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes} />;
}
