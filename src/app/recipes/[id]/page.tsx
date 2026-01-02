import { Metadata } from 'next';
import Image from 'next/image';

import Button from '@/components/Button/Button';
import EditIcon from '@/components/icons/EditIcon';
import { getRecipe } from '@/lib/supabase/recipes';

import DeleteButton from './components/DeleteButton/DeleteButton';
import MadeCheckbox from './components/MadeCheckbox/MadeCheckbox';
import RatingInput from './components/RatingInput/RatingInput';
import styles from './page.module.css';

export default async function RecipePage({
  params,
}: PageProps<'/recipes/[id]'>) {
  const { id } = await params;
  const recipe = await getRecipe(Number(id));

  if (recipe === null) {
    return <div>Recipe not found</div>;
  }

  const { name, ingredients, instructions, made, imageUrl, sourceUrl, rating } =
    recipe;

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
            <DeleteButton recipeId={Number(id)} />
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
          <MadeCheckbox recipeId={Number(id)} initialChecked={made} />
          <RatingInput recipeId={Number(id)} initialRating={rating} />
        </div>
      </div>
      {imageUrl && (
        <div className={styles.imageContainer}>
          <Image src={imageUrl} alt={name} className={styles.image} fill />
        </div>
      )}
      <div className={styles.ingredientsContainer}>
        <h2>Ingredients</h2>
        <ul className={styles.ingredients}>
          {ingredients?.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </div>
      <div className={styles.instructionsContainer}>
        <h2>Instructions</h2>
        <ol className={styles.instructions}>
          {instructions?.map((instruction) => (
            <li key={instruction}>{instruction}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(Number(id));

  return {
    title: `${recipe?.name} | Recipe Vault`,
  };
}
