import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import RecipeForm from '@/components/organisms/RecipeForm/RecipeForm';
import { getCategories } from '@/lib/supabase/queries/categories';
import { getEquipment } from '@/lib/supabase/queries/equipment';
import { getIngredientsForRecipeEdit } from '@/lib/supabase/queries/ingredients';
import { getMealTypes } from '@/lib/supabase/queries/mealTypes';
import { getOccasions } from '@/lib/supabase/queries/occasions';
import {
  getRecipeForEdit,
  getRecipeIngredientsForEdit,
} from '@/lib/supabase/queries/recipes';
import { isUserLoggedIn } from '@/lib/supabase/queries/user';

import styles from './page.module.css';

export default async function EditRecipePage({
  params,
}: PageProps<'/recipes/[id]/edit'>) {
  const { id } = await params;
  const [
    recipe,
    ingredientSections,
    categories,
    ingredients,
    equipment,
    mealTypes,
    occasions,
  ] = await Promise.all([
    getRecipeForEdit(id),
    getRecipeIngredientsForEdit(id),
    getCategories(),
    getIngredientsForRecipeEdit(),
    getEquipment(),
    getMealTypes(),
    getOccasions(),
  ]);

  const isLoggedIn = await isUserLoggedIn();

  if (!isLoggedIn) {
    redirect('/auth/login');
  }

  if (recipe === null) {
    return <div>Recipe not found</div>;
  }

  return (
    <div className={styles.page}>
      <h1>Edit Recipe</h1>
      <RecipeForm
        mode="update"
        recipeId={id}
        initialRecipe={recipe}
        initialIngredientSections={ingredientSections}
        categories={categories}
        ingredients={ingredients}
        equipment={equipment}
        mealTypes={mealTypes}
        occasions={occasions}
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
