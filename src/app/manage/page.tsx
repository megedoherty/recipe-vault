import { getCategories } from '@/lib/supabase/queries/categories';

import CategoryManager from './components/CategoryManager/CategoryManager';
import styles from './page.module.css';

export default async function ManagePage() {
  const categories = await getCategories();

  return (
    <div className={styles.page}>
      <h1>Manage</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
