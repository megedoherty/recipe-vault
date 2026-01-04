import { getCategories } from '@/lib/supabase/queries/categories';

import CreateRecipeForm from './components/CreateRecipeForm/CreateRecipeForm';
import styles from './page.module.css';

export default async function AddRecipePage() {
  const categories = await getCategories();

  return (
    <div className={styles.page}>
      <h1>Add Recipe</h1>
      <h2>Add a recipe manually</h2>
      <CreateRecipeForm categories={categories} />
    </div>
  );
}
