import { Metadata } from 'next';

import {
  getRecipeForDisplay,
  getRecipeIngredientsForDisplay,
} from '@/lib/supabase/queries/recipes';
import { isUserLoggedIn } from '@/lib/supabase/queries/user';

import IngredientsList from './components/IngredientsList/IngredientsList';
import InstructionsSection from './components/InstructionsSection/InstructionsSection';
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

  const { name, instructions, made, imageUrl, sourceUrl, rating } = recipe;

  return (
    <div className={styles.page}>
      <RecipeHeader
        recipeId={id}
        name={name}
        sourceUrl={sourceUrl}
        made={made}
        rating={rating}
        isLoggedIn={isLoggedIn}
      />
      <RecipeImageAndInfo
        category={recipe.category}
        equipment={recipe.equipment}
        servings={recipe.servings}
        storage={recipe.storage}
        imageUrl={imageUrl}
        name={name}
      />
      <section className={styles.ingredientsContainer}>
        <h2>Ingredients</h2>
        {ingredientSections?.map((ingredientSection) => (
          <section key={ingredientSection.title}>
            {ingredientSection.title && <h3>{ingredientSection.title}</h3>}
            <IngredientsList ingredients={ingredientSection.ingredients} />
          </section>
        ))}
      </section>
      <InstructionsSection
        instructions={instructions}
        ingredientMap={ingredientMap}
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
  const recipe = await getRecipeForDisplay(id);

  return {
    title: `${recipe?.name} | Recipe Vault`,
  };
}
