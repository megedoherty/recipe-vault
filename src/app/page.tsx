import { Metadata } from 'next';

import RecipeCard from '@/components/molecules/RecipeCard/RecipeCard';
import { getCategories } from '@/lib/supabase/queries/categories';
import { getIngredientCatalogForSearch } from '@/lib/supabase/queries/ingredientCatalog';
import { getAllRecipes } from '@/lib/supabase/queries/recipes';

import SearchForm from './components/SearchForm';
import styles from './page.module.css';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const query = await searchParams;
  const recipes = await getAllRecipes(query);
  const categories = await getCategories();
  const ingredientCatalog = await getIngredientCatalogForSearch();

  return (
    <div className={styles.page}>
      <h1>Recipes</h1>
      <SearchForm
        categories={categories}
        ingredientCatalog={ingredientCatalog}
      />
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
