import Image from 'next/image';

import { StorageInfo } from '@/types';

import MadeCheckbox from '../MadeCheckbox/MadeCheckbox';
import RatingInput from '../RatingInputForm/RatingInputForm';
import styles from './RecipeImageAndInfo.module.css';

interface RecipeImageAndInfoProps {
  category: string | null;
  imageUrl: string | null;
  servings: number | null;
  occasion: string | null;
  storage: StorageInfo[];
  name: string;
  equipment: string[];
  mealType: string | null;
  recipeId: string;
  made: boolean;
  rating: number | null;
}

export default function RecipeImageAndInfo({
  category,
  equipment,
  imageUrl,
  servings,
  storage,
  name,
  occasion,
  mealType,
  recipeId,
  made,
  rating,
}: RecipeImageAndInfoProps) {
  return (
    <div className={styles.container}>
      {imageUrl && (
        <div className={styles.imageContainer}>
          <Image src={imageUrl} alt={name} className={styles.image} fill />
        </div>
      )}
      <aside>
        <div className={styles.infoContainer}>
          <div className={styles.personalInfo}>
            <MadeCheckbox recipeId={recipeId} initialChecked={made} />
            <RatingInput recipeId={recipeId} initialRating={rating} />
          </div>
          <dl className={styles.infoContainer}>
            {mealType && (
              <div className={styles.infoItem}>
                <dt className={styles.infoItemLabel}>Meal Type:</dt>
                <dd>{mealType}</dd>
              </div>
            )}
            {category && (
              <div className={styles.infoItem}>
                <dt className={styles.infoItemLabel}>Category:</dt>
                <dd>{category}</dd>
              </div>
            )}
            {occasion && (
              <div className={styles.infoItem}>
                <dt className={styles.infoItemLabel}>Occasion:</dt>
                <dd>{occasion}</dd>
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
        </div>
      </aside>
    </div>
  );
}
