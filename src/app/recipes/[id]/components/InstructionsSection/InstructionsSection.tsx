'use client';

import {
  InstructionSection,
  RecipeIngredientDisplay,
  Step as StepType,
} from '@/types';

import Step from '../Step/Step';
import styles from './InstructionsSection.module.css';

interface InstructionsSectionProps {
  instructions: InstructionSection[] | null;
  ingredientMap: Record<string, RecipeIngredientDisplay>;
  updateActiveStep: (step: StepType) => void;
  getStepStatus?: (stepId: string) => 'selected' | 'done' | undefined;
}

export default function InstructionsSection({
  instructions,
  ingredientMap,
  updateActiveStep,
  getStepStatus,
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
              <Step
                key={step.id}
                step={step}
                ingredients={ingredientMap}
                updateActiveStep={updateActiveStep}
                getStepStatus={getStepStatus}
              />
            ))}
          </ol>
        </section>
      ))}
    </section>
  );
}
