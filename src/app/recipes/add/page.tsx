import { redirect } from 'next/navigation';

import { getCategories } from '@/lib/supabase/queries/categories';
import { getIngredientsForRecipeEdit } from '@/lib/supabase/queries/ingredients';
import { isUserLoggedIn } from '@/lib/supabase/queries/user';

import CreateRecipeForm from './components/CreateRecipeForm/CreateRecipeForm';
import styles from './page.module.css';

export default async function AddRecipePage() {
  const categories = await getCategories();
  const ingredients = await getIngredientsForRecipeEdit();
  const isLoggedIn = await isUserLoggedIn();

  if (!isLoggedIn) {
    redirect('/auth/login');
  }

  return (
    <div className={styles.page}>
      <h1>Add Recipe</h1>
      <h2>Add a recipe manually</h2>
      <CreateRecipeForm categories={categories} ingredients={ingredients} />
    </div>
  );
}
