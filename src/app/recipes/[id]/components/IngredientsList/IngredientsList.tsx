import Checkbox from '@/components/Checkbox/Checkbox';
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
          <Checkbox
            label={`${ingredient.quantity} ${ingredient.name}`}
            sizeVariant="small"
            id={ingredient.id}
            checkboxClassName={styles.checkbox}
          />
        </li>
      ))}
    </ul>
  );
}
