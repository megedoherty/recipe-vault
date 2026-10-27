import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import Button from '@/components/atoms/Button/Button';
import RecipeForm from '@/components/organisms/RecipeForm/RecipeForm';
import { parseRecipeFromUrl } from '@/lib/actions/recipeParser/recipeParser';
import { getCategories } from '@/lib/supabase/queries/categories';
import { getEquipment } from '@/lib/supabase/queries/equipment';
import { getIngredientsForRecipeEdit } from '@/lib/supabase/queries/ingredients';
import { getMealTypes } from '@/lib/supabase/queries/mealTypes';
import { getOccasions } from '@/lib/supabase/queries/occasions';
import {
  getRecipeForEdit,
  getRecipeIngredientsForEdit,
} from '@/lib/supabase/queries/recipes';
import { canModifyRecipe, getUser } from '@/lib/supabase/queries/user';
import { mergeRefreshedRecipe } from '@/lib/utils/refresh';
import { EditableRecipe, RecipeIngredientSectionsEditable } from '@/types';

import styles from './page.module.css';

export default async function EditRecipePage({
  params,
  searchParams,
}: PageProps<'/recipes/[id]/edit'>) {
  const { id } = await params;
  const { refresh } = await searchParams;
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

  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (recipe === null) {
    return <div>Recipe not found</div>;
  }

  // Only the owner (or an admin) can edit; send everyone else to the read-only view
  if (!canModifyRecipe(user, recipe.userId)) {
    redirect(`/recipes/${id}`);
  }

  let initialRecipe: EditableRecipe = recipe;
  let initialIngredientSections: RecipeIngredientSectionsEditable[] =
    ingredientSections;
  let imageOptions: string[] | undefined;
  let refreshStatus: 'success' | 'error' | null = null;

  if (refresh && recipe.sourceUrl) {
    try {
      const parsed = await parseRecipeFromUrl(
        recipe.sourceUrl,
        ingredients,
        categories,
        mealTypes,
      );

      if (
        parsed.recipe.name === '' ||
        parsed.ingredients.length === 0 ||
        parsed.recipe.instructions.length === 0
      ) {
        throw new Error('Missing recipe name, ingredients, or instructions');
      }

      const merged = mergeRefreshedRecipe(recipe, parsed);
      initialRecipe = merged.recipe;
      initialIngredientSections = parsed.ingredients;
      imageOptions = merged.imageOptions;
      refreshStatus = 'success';
    } catch (error) {
      console.error('Error refreshing recipe', error);
      refreshStatus = 'error';
    }
  }

  return (
    <div className={styles.page}>
      <h1>Edit Recipe</h1>
      {refreshStatus === 'success' && (
        <div className={styles.banner}>
          <p>
            Reviewing re-imported data. Nothing is saved until you click Save.
          </p>
          <Button href={`/recipes/${id}`} variant="secondary" size="small">
            Cancel
          </Button>
        </div>
      )}
      {refreshStatus === 'error' && (
        <div className={styles.banner}>
          Couldn&apos;t refresh from the source URL. You can still edit the
          saved recipe.
        </div>
      )}
      <RecipeForm
        key={refreshStatus ?? 'saved'}
        mode="update"
        recipeId={id}
        initialRecipe={initialRecipe}
        initialIngredientSections={initialIngredientSections}
        imageOptions={imageOptions}
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
