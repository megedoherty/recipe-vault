import RecipeCard from '@/components/RecipeCard/RecipeCard.component';
import { createClient } from '@/lib/supabase/server';

import styles from './page.module.css';

export default async function Home() {
  const supabase = await createClient();

  const { data: recipes } = await supabase.from('recipe').select('*');

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Recipe Vault</h1>
        <ul>
          {recipes?.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
