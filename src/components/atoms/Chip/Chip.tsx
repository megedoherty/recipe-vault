import { PropsWithChildren } from 'react';

import styles from './Chip.module.css';

interface ChipProps extends PropsWithChildren {
  onClick: () => void;
}

export default function Chip({ onClick, children }: ChipProps) {
  return (
    <button onClick={onClick} className={styles.chip}>
      {children}
    </button>
  );
}
