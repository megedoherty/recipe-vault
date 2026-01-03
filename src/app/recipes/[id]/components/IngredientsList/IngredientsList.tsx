import { EditableIngredient } from '@/types';

import styles from './IngredientsList.module.css';

interface IngredientsListProps {
  ingredients: EditableIngredient[];
}

export default function IngredientsList({ ingredients }: IngredientsListProps) {
  return (
    <ul className={styles.list}>
      {ingredients.map((ingredient) => (
        <li key={ingredient.id} className={styles.item}>
          <input
            type="checkbox"
            id={ingredient.id}
            className={styles.checkbox}
          />
          <label htmlFor={ingredient.id}>
            {ingredient.quantity} {ingredient.name}
          </label>
        </li>
      ))}
    </ul>
  );
}
