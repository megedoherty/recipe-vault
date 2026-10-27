import { Pencil, RefreshCw } from 'lucide-react';

import Button from '@/components/atoms/Button/Button';
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
  // Whether the user can edit or delete the recipe (owner or admin)
  canEdit: boolean;
  // The recipe ingredients
  ingredients: RecipeIngredientDisplay[];
}

export default function RecipeHeader({
  recipeId,
  name,
  sourceUrl,
  isLoggedIn,
  canEdit,
  ingredients,
}: RecipeHeaderProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{name}</h1>
        {isLoggedIn && (
          <div className={styles.headerButtons}>
            {canEdit && (
              <Button
                href={`/recipes/${recipeId}/edit`}
                aria-label="Edit recipe"
                iconOnly
              >
                <Pencil />
              </Button>
            )}
            {canEdit && sourceUrl && (
              <Button
                href={`/recipes/${recipeId}/edit?refresh=1`}
                aria-label="Refresh recipe from source"
                iconOnly
              >
                <RefreshCw />
              </Button>
            )}
            <AddToShoppingListButton
              ingredients={ingredients}
              recipeId={recipeId}
              recipeName={name}
            />
            {canEdit && <DeleteButton recipeId={recipeId} />}
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
