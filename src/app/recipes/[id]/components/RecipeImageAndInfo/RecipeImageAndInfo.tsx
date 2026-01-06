import Image from 'next/image';

import styles from './RecipeImageAndInfo.module.css';

interface RecipeImageAndInfoProps {
  category: string | null;
  imageUrl: string | null;
  name: string;
}

export default function RecipeImageAndInfo({
  category,
  imageUrl,
  name,
}: RecipeImageAndInfoProps) {
  return (
    <div className={styles.container}>
      <aside>
        <dl>
          {category && (
            <div className={styles.infoItem}>
              <dt>Category:</dt>
              <dd>{category}</dd>
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
