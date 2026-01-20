import Image from 'next/image';
import Link from 'next/link';

import RecipeIcon from '@/components/atoms/icons/RecipeIcon';
import { RecipeSummary } from '@/types';

import styles from './RecipeCard.module.css';

interface RecipeCardProps {
  recipe: RecipeSummary;
  priority?: boolean;
}

export default function RecipeCard({
  recipe,
  priority = false,
}: RecipeCardProps) {
  const { name, id, imageUrl, rating, made } = recipe;

  return (
    <article className={styles.card}>
      <Link
        href={`/recipes/${id}`}
        className={styles.link}
        aria-label={`View ${name} recipe`}
      />
      <div className={styles.imageContainer}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${name} recipe image`}
            fill
            className={styles.image}
            sizes="(max-width: 577px) 100vw, (max-width: 860px) 50vw, (max-width: 1126px) 33vw, 25vw"
            priority={priority}
          />
        ) : (
          <RecipeIcon className={styles.defaultImage} />
        )}
      </div>
      <div className={styles.content}>
        <p>{name}</p>
      </div>
      <div className={styles.info}>
        {made && <div className={styles.made}>✔</div>}
        {rating && (
          <div className={styles.rating}>
            {Array.from({ length: rating }, (_, index) => (
              <svg
                key={index}
                aria-hidden="true"
                className={styles.starIcon}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
