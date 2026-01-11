import RecipeCard from '@/components/molecules/RecipeCard/RecipeCard';
import { getAllRecipes } from '@/lib/supabase/queries/recipes';

import styles from './RecipesList.module.css';

interface RecipesListProps {
  query: Record<string, string | string[] | undefined>;
}

export default async function RecipesList({ query }: RecipesListProps) {
  // Parse and convert query params to proper types
  const includeAllUsers = query.includeAllUsers === 'true';
  const name = typeof query.name === 'string' ? query.name : undefined;
  const categoryId =
    typeof query.categoryId === 'string'
      ? parseInt(query.categoryId, 10)
      : undefined;
  const includeIngredients =
    typeof query.includeIngredients === 'string'
      ? query.includeIngredients
      : undefined;
  const excludeIngredients =
    typeof query.excludeIngredients === 'string'
      ? query.excludeIngredients
      : undefined;
  const equipment =
    typeof query.equipment === 'string' ? query.equipment : undefined;
  const minServings =
    typeof query.minServings === 'string'
      ? parseInt(query.minServings, 10)
      : undefined;
  const maxServings =
    typeof query.maxServings === 'string'
      ? parseInt(query.maxServings, 10)
      : undefined;
  const made =
    typeof query.made === 'string'
      ? query.made === 'true'
      : undefined;
  const minRating =
    typeof query.minRating === 'string'
      ? parseInt(query.minRating, 10)
      : undefined;
  const mealTypeId =
    typeof query.mealTypeId === 'string'
      ? parseInt(query.mealTypeId, 10)
      : undefined;
  const occasionId =
    typeof query.occasionId === 'string'
      ? parseInt(query.occasionId, 10)
      : undefined;

  const recipes = await getAllRecipes({
    name,
    categoryId,
    includeIngredients,
    excludeIngredients,
    equipment,
    minServings,
    maxServings,
    made,
    minRating,
    mealTypeId,
    occasionId,
    includeAllUsers,
  });

  if (recipes.length === 0) {
    return <p>No recipes found</p>;
  }

  return (
    <ul className={styles.recipeGrid}>
      {recipes.map((recipe) => (
        <li key={recipe.id} className={styles.listItem}>
          <RecipeCard recipe={recipe} />
        </li>
      ))}
    </ul>
  );
}
