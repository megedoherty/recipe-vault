import { RecipeIngredientDisplay, Step as StepType } from '@/types';

import styles from './Step.module.css';

interface StepProps {
  step: StepType;
  ingredients: Record<string, RecipeIngredientDisplay>;
  updateActiveStep: (step: StepType) => void;
  getStepStatus?: (stepId: string) => 'selected' | 'done' | undefined;
}

export default function Step({
  step,
  ingredients,
  updateActiveStep,
  getStepStatus,
}: StepProps) {
  const { id, text, ingredientIds } = step;

  let ingredientsUsed: string[] = [];
  if (ingredientIds && ingredientIds?.length > 0) {
    ingredientsUsed = ingredientIds
      .map((ingredientId) => ingredients[ingredientId])
      .map((ingredient) =>
        `${ingredient.quantity ?? ''} ${ingredient.name}`.trim(),
      );
  }

  const status = getStepStatus?.(id);
  const extraClasses = status ? styles[status] : '';

  return (
    <li className={`${styles.step} ${extraClasses ? extraClasses : ''}`}>
      <button
        className={styles.stepButton}
        onClick={() => updateActiveStep(step)}
      >
        <div>
          <p className={styles.stepText}>{text}</p>
          {ingredientsUsed.length > 0 && (
            <p className={styles.stepIngredients}>
              {ingredientsUsed.join(', ')}
            </p>
          )}
        </div>
      </button>
    </li>
  );
}
