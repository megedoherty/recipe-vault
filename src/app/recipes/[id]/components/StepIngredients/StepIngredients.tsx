import { RecipeIngredientDisplay } from '@/types';

import styles from './StepIngredients.module.css';

interface StepIngredientsProps {
  ingredientIds: string[] | undefined;
  ingredients: Record<string, RecipeIngredientDisplay>;
}

export default function StepIngredients({
  ingredientIds,
  ingredients,
}: StepIngredientsProps) {
  if (!ingredientIds || ingredientIds.length === 0) return null;

  const ingredientsUsed = ingredientIds
    .map((ingredientId) => ingredients[ingredientId])
    .map((ingredient) =>
      `${ingredient.quantity ?? ''} ${ingredient.name}`.trim(),
    );

  return <p className={styles.stepIngredients}>{ingredientsUsed.join(', ')}</p>;
}
