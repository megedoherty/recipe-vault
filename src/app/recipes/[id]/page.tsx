import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import MadeCheckbox from '@/components/MadeCheckbox/MadeCheckbox.component';
import RatingInput from '@/components/RatingInput/RatingInput.component';
import { getRecipe } from '@/lib/supabase/recipes';

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
    <div>
      <h1>Recipe for {name}</h1>
      <Link href={`/recipes/${id}/edit`}>Edit</Link>
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={name}
          width={100}
          height={100}
          className={styles.image}
        />
      )}
      <MadeCheckbox recipeId={Number(id)} initialChecked={made} />
      <RatingInput recipeId={Number(id)} initialRating={rating} />
      <p>
        Source:{' '}
        {sourceUrl ? (
          <a target="_blank" rel="noopener noreferrer" href={sourceUrl}>
            {sourceUrl}
          </a>
        ) : (
          'No source'
        )}
      </p>
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
