import { Metadata } from 'next';

import {
  getRecipe,
  getRecipeIngredients,
} from '@/lib/supabase/queries/recipes';

import UpdateRecipeForm from './components/UpdateRecipeForm/UpdateRecipeForm';
import styles from './page.module.css';

export default async function EditRecipePage({
  params,
}: PageProps<'/recipes/[id]/edit'>) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  const ingredientSections = await getRecipeIngredients(id);

  if (recipe === null) {
    return <div>Recipe not found</div>;
  }

  return (
    <div className={styles.page}>
      <h1>Edit Recipe</h1>
      <UpdateRecipeForm
        recipe={recipe}
        ingredientSections={ingredientSections}
      />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(id);

  return {
    title: `Edit ${recipe?.name} | Recipe Vault`,
  };
}
