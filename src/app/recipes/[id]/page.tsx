import { Metadata } from 'next';

import {
  getRecipeForDisplay,
  getRecipeIngredientsForDisplay,
} from '@/lib/supabase/queries/recipes';
import { isUserLoggedIn } from '@/lib/supabase/queries/user';

import IngredientsAndInstructionsSection from './components/IngredientsAndInstructionsSection/IngredientsAndInstructionsSection';
import RecipeHeader from './components/RecipeHeader/RecipeHeader';
import RecipeImageAndInfo from './components/RecipeImageAndInfo/RecipeImageAndInfo';
import styles from './page.module.css';

export default async function RecipePage({
  params,
}: PageProps<'/recipes/[id]'>) {
  const { id } = await params;
  const recipe = await getRecipeForDisplay(id);
  const ingredientSections = await getRecipeIngredientsForDisplay(id);
  const isLoggedIn = await isUserLoggedIn();

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

  return (
    <div className={styles.page}>
      <RecipeHeader
        recipeId={id}
        name={name}
        sourceUrl={sourceUrl}
        isLoggedIn={isLoggedIn}
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
      />
      <IngredientsAndInstructionsSection
        ingredientSections={ingredientSections}
        instructions={instructions}
        ingredientMap={ingredientMap}
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
    title: `${recipe?.name} | Recipe Vault`,
  };
}
