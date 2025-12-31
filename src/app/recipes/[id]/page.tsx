import { createClient } from '@/lib/supabase/server';

import styles from './page.module.css';

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: recipe } = await supabase
    .from('recipe')
    .select('*')
    .eq('id', Number(id));

  if (recipe === null || recipe.length === 0) {
    return <div>Recipe not found</div>;
  }

  const { name, ingredients, instructions } = recipe[0];

  return (
    <div>
      <h1>Recipe for {name}</h1>
      <h2>Ingredients</h2>
      <ul className={styles.ingredients}>
        {ingredients?.map((ingredient) => (
          <li key={ingredient}>{ingredient}</li>
        ))}
      </ul>
      <h2>Instructions</h2>
      <ol className={styles.instructions}>
        {instructions?.map((instruction) => (
          <li key={instruction}>{instruction}</li>
        ))}
      </ol>
    </div>
  );
}
