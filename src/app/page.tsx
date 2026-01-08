import { Metadata } from 'next';
import { Suspense } from 'react';

import LoadingSpinner from '@/components/atoms/LoadingSpinner/LoadingSpinner';
import { getCategories } from '@/lib/supabase/queries/categories';
import { getIngredientCatalogForSearch } from '@/lib/supabase/queries/ingredientCatalog';

import RecipesList from './components/RecipesList/RecipesList';
import SearchForm from './components/SearchForm';
import styles from './page.module.css';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const query = await searchParams;
  const categories = await getCategories();
  const ingredientCatalog = await getIngredientCatalogForSearch();

  return (
    <div className={styles.page}>
      <h1>Recipes</h1>
      <SearchForm
        categories={categories}
        ingredientCatalog={ingredientCatalog}
      />
      <Suspense
        key={JSON.stringify(query)}
        fallback={
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '2rem',
            }}
          >
            <LoadingSpinner size="large" />
          </div>
        }
      >
        <RecipesList query={query} />
      </Suspense>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'All Recipes | Recipe Vault',
};
