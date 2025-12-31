import { Recipe } from '@/types';

import styles from './RecipeCard.module.css';

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const { name, id } = recipe;

  return (
    <article className={styles.recipeCard}>
      <a href={`/recipes/${id}`}>
        <h2>{name}</h2>
      </a>
    </article>
  );
}
