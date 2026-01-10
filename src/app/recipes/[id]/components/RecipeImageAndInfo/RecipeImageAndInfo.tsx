import Image from 'next/image';

import { StorageInfo } from '@/types';

import styles from './RecipeImageAndInfo.module.css';

interface RecipeImageAndInfoProps {
  category: string | null;
  imageUrl: string | null;
  servings: number | null;
  storage: StorageInfo[];
  name: string;
  equipment: string[];
}

export default function RecipeImageAndInfo({
  category,
  equipment,
  imageUrl,
  servings,
  storage,
  name,
}: RecipeImageAndInfoProps) {
  return (
    <div className={styles.container}>
      <aside>
        <dl className={styles.infoContainer}>
          {category && (
            <div className={styles.infoItem}>
              <dt className={styles.infoItemLabel}>Category:</dt>
              <dd>{category}</dd>
            </div>
          )}
          {servings && (
            <div className={styles.infoItem}>
              <dt className={styles.infoItemLabel}>Servings:</dt>
              <dd>{servings}</dd>
            </div>
          )}
          {equipment.length > 0 && (
            <div>
              <dt className={styles.infoItemLabel}>Equipment:</dt>
              <dd>
                <ul className={styles.infoItemList}>
                  {equipment.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {storage.length > 0 && (
            <div>
              <dt className={styles.infoItemLabel}>Storage:</dt>
              <dd>
                <ul className={styles.infoItemList}>
                  {storage.map((s) => (
                    <li key={s.location}>
                      {s.location} - {s.days} days
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </aside>
      {imageUrl && (
        <div className={styles.imageContainer}>
          <Image src={imageUrl} alt={name} className={styles.image} fill />
        </div>
      )}
    </div>
  );
}
