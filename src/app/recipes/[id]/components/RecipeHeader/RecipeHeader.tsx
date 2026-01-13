import Button from '@/components/atoms/Button/Button';
import EditIcon from '@/components/atoms/icons/EditIcon';

import DeleteButton from '../DeleteButton/DeleteButton';
import styles from './RecipeHeader.module.css';

interface RecipeHeaderProps {
  recipeId: string;
  name: string;
  sourceUrl: string | null;
  isLoggedIn: boolean;
}

export default function RecipeHeader({
  recipeId,
  name,
  sourceUrl,
  isLoggedIn,
}: RecipeHeaderProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{name} Recipe</h1>
        {isLoggedIn && (
          <div className={styles.headerButtons}>
            <Button
              href={`/recipes/${recipeId}/edit`}
              aria-label="Edit recipe"
              iconOnly
            >
              <EditIcon />
            </Button>
            <DeleteButton recipeId={recipeId} />
          </div>
        )}
      </header>
      {sourceUrl && (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={sourceUrl}
          className={styles.source}
        >
          {sourceUrl}
        </a>
      )}
    </div>
  );
}
