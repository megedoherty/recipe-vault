import { PropsWithChildren } from 'react';

import styles from './Hint.module.css';

export default function Hint({ children }: PropsWithChildren) {
  return <small className={styles.hint}>{children}</small>;
}
