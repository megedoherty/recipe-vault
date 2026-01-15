import RecipeCard from '@/components/molecules/RecipeCard/RecipeCard';
import { getAllRecipes } from '@/lib/supabase/queries/recipes';

import { parseQueryParams } from './RecipeList.utils';
import styles from './RecipesList.module.css';

interface RecipesListProps {
  query: Record<string, string | string[] | undefined>;
}

export default async function RecipesList({ query }: RecipesListProps) {
  const {
    includeAllUsers,
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
  } = parseQueryParams(query);

  const { recipes, count } = await getAllRecipes({
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
    <>
      <p>
        {count} {count === 1 ? 'recipe' : 'recipes'} found
      </p>
      <ul className={styles.recipeGrid}>
        {recipes.map((recipe) => (
          <li key={recipe.id} className={styles.listItem}>
            <RecipeCard recipe={recipe} />
          </li>
        ))}
      </ul>
    </>
  );
}
