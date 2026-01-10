import Input from '@/components/atoms/Input/Input';
import { StorageInfo } from '@/types';

import styles from './StorageInfoEditor.module.css';

interface StorageInfoEditorProps {
  storage: StorageInfo[];
}

export default function StorageInfoEditor({ storage }: StorageInfoEditorProps) {
  return (
    <div>
      <h3>Storage</h3>
      <ul className={styles.list}>
        {storage.map((info) => (
          <li key={info.location} className={styles.listItem}>
            <Input
              type="number"
              label={`${info.location} for`}
              name={info.location}
              id={info.location}
              direction="horizontal"
              inputClassName={styles.daysInput}
              defaultValue={info.days?.toString() ?? ''}
              min={0}
            />
            days
          </li>
        ))}
      </ul>
    </div>
  );
}
