import { Metadata } from 'next';

import RecipeCard from '@/components/RecipeCard/RecipeCard.component';
import { getAllRecipes } from '@/lib/supabase/recipes';

import SearchForm from './components/SearchForm.component';
import styles from './page.module.css';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const query = await searchParams;
  const recipes = await getAllRecipes(query);

  return (
    <div className={styles.page}>
      <h1>Recipes</h1>
      <SearchForm />
      {recipes.length === 0 ? (
        <p>No recipes found</p>
      ) : (
        <ul className={styles.recipeGrid}>
          {recipes.map((recipe) => (
            <li key={recipe.id} className={styles.listItem}>
              <RecipeCard recipe={recipe} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const metadata: Metadata = {
  title: 'All Recipes | Recipe Vault',
};
