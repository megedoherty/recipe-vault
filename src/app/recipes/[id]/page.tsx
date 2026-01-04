import { Metadata } from 'next';
import Image from 'next/image';

import Button from '@/components/Button/Button';
import EditIcon from '@/components/icons/EditIcon';
import {
  getRecipe,
  getRecipeIngredients,
} from '@/lib/supabase/queries/recipes';

import DeleteButton from './components/DeleteButton/DeleteButton';
import IngredientsList from './components/IngredientsList/IngredientsList';
import MadeCheckbox from './components/MadeCheckbox/MadeCheckbox';
import RatingInput from './components/RatingInput/RatingInput';
import styles from './page.module.css';

export default async function RecipePage({
  params,
}: PageProps<'/recipes/[id]'>) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  const ingredientSections = await getRecipeIngredients(id);

  if (recipe === null) {
    return <div>Recipe not found</div>;
  }

  const { name, instructions, made, imageUrl, sourceUrl, rating } = recipe;

  return (
    <div className={styles.page}>
      <div className={styles.headerContainer}>
        <header className={styles.header}>
          <h1>{name} Recipe</h1>
          <div className={styles.headerButtons}>
            <Button
              href={`/recipes/${id}/edit`}
              aria-label="Edit recipe"
              iconOnly
            >
              <EditIcon />
            </Button>
            <DeleteButton recipeId={id} />
          </div>
        </header>
        {sourceUrl && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={sourceUrl}
            className={styles.source}
          >
            {sourceUrl}
          </a>
        )}
        <div className={styles.personalInfo}>
          <MadeCheckbox recipeId={id} initialChecked={made} />
          <RatingInput recipeId={id} initialRating={rating} />
        </div>
      </div>
      <div className={styles.imageAndInfoContainer}>
        <aside>
          <dl>
            {recipe.category && (
              <div className={styles.infoItem}>
                <dt>Category:</dt>
                <dd>{recipe.category.name}</dd>
              </div>
            )}
          </dl>
        </aside>
        {imageUrl && (
          <div className={styles.imageContainer}>
            <Image src={imageUrl} alt={name} className={styles.image} fill />
          </div>
        )}
      </div>
      <section className={styles.ingredientsContainer}>
        <h2>Ingredients</h2>
        {ingredientSections?.map((ingredientSection) => (
          <section key={ingredientSection.title}>
            {ingredientSection.title && <h3>{ingredientSection.title}</h3>}
            <IngredientsList ingredients={ingredientSection.ingredients} />
          </section>
        ))}
      </section>
      <section className={styles.instructionsContainer}>
        <h2>Instructions</h2>
        {instructions?.map((instructionSection) => (
          <section key={instructionSection.id}>
            {instructionSection.title && <h3>{instructionSection.title}</h3>}
            <ol className={styles.instructionsList}>
              {instructionSection.steps.map((step) => (
                <li key={step.id}>{step.text}</li>
              ))}
            </ol>
          </section>
        ))}
      </section>
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
    title: `${recipe?.name} | Recipe Vault`,
  };
}
