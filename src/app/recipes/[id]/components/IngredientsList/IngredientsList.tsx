import Checkbox from '@/components/atoms/Checkbox/Checkbox';
import { IngredientDisplay } from '@/types';

import styles from './IngredientsList.module.css';

interface IngredientsListProps {
  ingredients: IngredientDisplay[];
}

export default function IngredientsList({ ingredients }: IngredientsListProps) {
  return (
    <ul className={styles.list}>
      {ingredients.map((ingredient) => (
        <li key={ingredient.id} className={styles.item}>
          <Checkbox
            label={`${ingredient.quantity ?? ''} ${ingredient.name}`.trim()}
            checkboxSize="small"
            id={ingredient.id}
            checkboxClassName={styles.checkbox}
          />
        </li>
      ))}
    </ul>
  );
}
