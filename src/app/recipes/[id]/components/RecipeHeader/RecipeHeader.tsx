import Button from '@/components/atoms/Button/Button';
import EditIcon from '@/components/atoms/icons/EditIcon';
import { RecipeIngredientDisplay } from '@/types';

import AddToShoppingListButton from '../AddToShoppingListButton/AddToShoppingListButton';
import DeleteButton from '../DeleteButton/DeleteButton';
import styles from './RecipeHeader.module.css';

interface RecipeHeaderProps {
  // The recipe ID
  recipeId: string;
  // The recipe name
  name: string;
  // The recipe URL
  sourceUrl: string | null;
  // Whether the user is logged in
  isLoggedIn: boolean;
  // The recipe ingredients
  ingredients: RecipeIngredientDisplay[];
}

export default function RecipeHeader({
  recipeId,
  name,
  sourceUrl,
  isLoggedIn,
  ingredients,
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
            <AddToShoppingListButton ingredients={ingredients} />
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
