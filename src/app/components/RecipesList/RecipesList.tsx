import RecipeCard from '@/components/molecules/RecipeCard/RecipeCard';
import { getAllRecipes } from '@/lib/supabase/queries/recipes';

import styles from './RecipesList.module.css';

interface RecipesListProps {
  query: Record<string, string | string[] | undefined>;
}

export default async function RecipesList({ query }: RecipesListProps) {
  const recipes = await getAllRecipes(query);

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
