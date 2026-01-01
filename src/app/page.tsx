import { Metadata } from 'next';

import RecipeCard from '@/components/RecipeCard/RecipeCard.component';
import { getAllRecipes } from '@/lib/supabase/recipes';

import styles from './page.module.css';

export default async function Home() {
  const recipes = await getAllRecipes();

  return (
    <div className={styles.page}>
      <h1>Recipes</h1>
      <ul className={styles.recipeGrid}>
        {recipes.map((recipe) => (
          <li key={recipe.id} className={styles.recipeCard}>
            <RecipeCard recipe={recipe} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'All Recipes | Recipe Vault',
};
