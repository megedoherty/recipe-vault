import { Metadata } from 'next';

import {
  getRecipeForDisplay,
  getRecipeIngredientsForDisplay,
} from '@/lib/supabase/queries/recipes';
import { canModifyRecipe, getUser } from '@/lib/supabase/queries/user';

import CookingModeToggle from './components/CookingModeToggle/CookingModeToggle';
import IngredientsAndInstructionsSection from './components/IngredientsAndInstructionsSection/IngredientsAndInstructionsSection';
import RecipeHeader from './components/RecipeHeader/RecipeHeader';
import RecipeImageAndInfo from './components/RecipeImageAndInfo/RecipeImageAndInfo';
import styles from './page.module.css';

export default async function RecipePage({
  params,
}: PageProps<'/recipes/[id]'>) {
  const { id } = await params;
  const [recipe, ingredientSections, user] = await Promise.all([
    getRecipeForDisplay(id),
    getRecipeIngredientsForDisplay(id),
    getUser(),
  ]);

  const ingredients = ingredientSections.flatMap(
    (section) => section.ingredients,
  );
  const ingredientMap = Object.fromEntries(
    ingredients.map((ingredient) => [ingredient.id, ingredient]),
  );

  if (recipe === null) {
    return <div>Recipe not found</div>;
  }

  const { name, instructions, made, imageUrl, sourceUrl, rating, notes } =
    recipe;
  // Only the owner (or an admin) can edit; everyone else gets a read-only view
  const canEdit = canModifyRecipe(user, recipe.userId);

  return (
    <div className={styles.page}>
      <RecipeHeader
        recipeId={id}
        name={name}
        sourceUrl={sourceUrl}
        isLoggedIn={!!user}
        canEdit={canEdit}
        ingredients={ingredients}
      />
      <RecipeImageAndInfo
        category={recipe.category}
        equipment={recipe.equipment}
        servings={recipe.servings}
        storage={recipe.storage}
        occasion={recipe.occasion}
        imageUrl={imageUrl}
        name={name}
        mealType={recipe.mealType}
        recipeId={id}
        made={made}
        rating={rating}
        canEdit={canEdit}
      />
      <div className={styles.cookingMode}>
        <CookingModeToggle />
      </div>
      <IngredientsAndInstructionsSection
        ingredientSections={ingredientSections}
        instructions={instructions}
        ingredientMap={ingredientMap}
        servings={recipe.servings}
        containerClassName={styles.sectionContainer}
      />
      {notes && (
        <section className={`${styles.sectionContainer} ${styles.notes}`}>
          <h2>Notes</h2>
          {notes.split('\n').map((line, index) => {
            if (line.trim() === '') {
              return null;
            }
            return <p key={index}>{line}</p>;
          })}
        </section>
      )}
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipeForDisplay(id);

  return {
    title: `${recipe?.name ?? 'Recipe not found'} | Recipe Vault`,
  };
}
