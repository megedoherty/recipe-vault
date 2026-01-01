import Image from 'next/image';
import Link from 'next/link';

import HasMadeCheckbox from '@/components/HasMadeCheckbox/HasMadeCheckbox.compoent';
import { getRecipe } from '@/lib/supabase/recipes';

import styles from './page.module.css';

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const recipe = await getRecipe(Number(id));

  if (recipe === null) {
    return <div>Recipe not found</div>;
  }

  const {
    name,
    ingredients,
    instructions,
    hasMade,
    imageUrl,
    sourceUrl,
    rating,
  } = recipe;

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
      <HasMadeCheckbox recipeId={Number(id)} initialChecked={hasMade} />
      <p>Rating: {rating ? rating : 'Not rated'}</p>
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
