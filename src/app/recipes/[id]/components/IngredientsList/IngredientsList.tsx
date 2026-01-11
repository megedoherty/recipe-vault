import Checkbox from '@/components/atoms/Checkbox/Checkbox';
import { RecipeIngredientDisplay } from '@/types';

import styles from './IngredientsList.module.css';

interface IngredientsListProps {
  ingredients: RecipeIngredientDisplay[];
  selectedIngredients: string[];
}

export default function IngredientsList({
  ingredients,
  selectedIngredients,
}: IngredientsListProps) {
  return (
    <ul className={styles.list}>
      {ingredients.map((ingredient) => (
        <li key={ingredient.id} className={styles.item}>
          <Checkbox
            label={`${ingredient.quantity ?? ''} ${ingredient.name}`.trim()}
            checkboxSize="small"
            id={ingredient.id}
            checkboxClassName={`${styles.checkbox} ${selectedIngredients.includes(ingredient.id) ? styles.selected : ''}`}
            containerClassName={`${styles.checkboxContainer} ${selectedIngredients.includes(ingredient.id) ? styles.selected : ''}`}
          />
        </li>
      ))}
    </ul>
  );
}
