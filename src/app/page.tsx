import { Metadata } from 'next';
import { Suspense } from 'react';

import LoadingSpinner from '@/components/atoms/LoadingSpinner/LoadingSpinner';
import { getCategories } from '@/lib/supabase/queries/categories';
import { getEquipment } from '@/lib/supabase/queries/equipment';
import { getIngredientsForSearch } from '@/lib/supabase/queries/ingredients';
import { getServingsRange } from '@/lib/supabase/queries/recipes';

import RecipesList from './components/RecipesList/RecipesList';
import SearchForm from './components/SearchForm';
import styles from './page.module.css';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const query = await searchParams;
  const categories = await getCategories();
  const ingredients = await getIngredientsForSearch();
  const equipment = await getEquipment();
  const servingsRange = await getServingsRange();

  return (
    <div className={styles.page}>
      <h1>Recipes</h1>
      <SearchForm
        categories={categories}
        ingredients={ingredients}
        equipment={equipment}
        servingsRange={servingsRange}
      />
      <Suspense
        key={JSON.stringify(query)}
        fallback={<LoadingSpinner size="large" isCentered />}
      >
        <RecipesList query={query} />
      </Suspense>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'All Recipes | Recipe Vault',
};
