import { IngredientDisplay, InstructionSection } from '@/types';

import StepIngredients from '../StepIngredients/StepIngredients';
import styles from './InstructionsSection.module.css';

interface InstructionsSectionProps {
  instructions: InstructionSection[] | null;
  ingredientMap: Record<string, IngredientDisplay>;
}

export default function InstructionsSection({
  instructions,
  ingredientMap,
}: InstructionsSectionProps) {
  if (!instructions) return null;

  return (
    <section className={styles.container}>
      <h2>Instructions</h2>
      {instructions.map((instructionSection) => (
        <section key={instructionSection.id}>
          {instructionSection.title && <h3>{instructionSection.title}</h3>}
          <ol className={styles.instructionsList}>
            {instructionSection.steps.map((step) => (
              <li key={step.id}>
                <p>{step.text}</p>
                <StepIngredients
                  ingredientIds={step.ingredientIds}
                  ingredients={ingredientMap}
                />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </section>
  );
}
