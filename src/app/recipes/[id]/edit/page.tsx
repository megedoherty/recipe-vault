import { Metadata } from 'next';

import { getCategories } from '@/lib/supabase/queries/categories';
import {
  getRecipeForEdit,
  getRecipeIngredientsForEdit,
} from '@/lib/supabase/queries/recipes';

import UpdateRecipeForm from './components/UpdateRecipeForm/UpdateRecipeForm';
import styles from './page.module.css';

export default async function EditRecipePage({
  params,
}: PageProps<'/recipes/[id]/edit'>) {
  const { id } = await params;
  const recipe = await getRecipeForEdit(id);
  const ingredientSections = await getRecipeIngredientsForEdit(id);
  const categories = await getCategories();

  if (recipe === null) {
    return <div>Recipe not found</div>;
  }

  return (
    <div className={styles.page}>
      <h1>Edit Recipe</h1>
      <UpdateRecipeForm
        recipeId={id}
        recipe={recipe}
        ingredientSections={ingredientSections}
        categories={categories}
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
  const recipe = await getRecipeForEdit(id);

  return {
    title: `Edit ${recipe?.name} | Recipe Vault`,
  };
}
