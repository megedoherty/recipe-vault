import Checkbox from '@/components/atoms/Checkbox/Checkbox';
import { RecipeIngredientDisplay } from '@/types';

import styles from './IngredientsList.module.css';

interface IngredientsListProps {
  ingredients: RecipeIngredientDisplay[];
  selectedIngredients: string[];
  // Called with each item's element as it mounts (and null as it unmounts)
  registerItem?: (id: string, element: HTMLLIElement | null) => void;
}

export default function IngredientsList({
  ingredients,
  selectedIngredients,
  registerItem,
}: IngredientsListProps) {
  return (
    <ul className={styles.list}>
      {ingredients.map((ingredient) => (
        <li
          key={ingredient.id}
          className={styles.item}
          ref={(element) => registerItem?.(ingredient.id, element)}
        >
          <Checkbox
            label={`${ingredient.quantity ?? ''} ${ingredient.name}`.trim()}
            checkboxSize="small"
            alignItems="start"
            checkboxClassName={`${styles.checkbox} ${selectedIngredients.includes(ingredient.id) ? styles.selected : ''}`}
            containerClassName={`${styles.checkboxContainer} ${selectedIngredients.includes(ingredient.id) ? styles.selected : ''}`}
          />
        </li>
      ))}
    </ul>
  );
}
