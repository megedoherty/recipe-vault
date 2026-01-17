'use client';

import { useMemo, useState } from 'react';

import {
  InstructionSection,
  RecipeIngredientDisplay,
  RecipeIngredientSections,
  Step,
} from '@/types';

import IngredientsList from '../IngredientsList/IngredientsList';
import InstructionsSection from '../InstructionsSection/InstructionsSection';
import styles from './IngredientsAndInstructionsSection.module.css';

interface IngredientsAndInstructionsSectionProps {
  // Section class name
  containerClassName?: string;
  // All the ingredients, grouped by section
  ingredientSections: RecipeIngredientSections[];
  // All the instructions, grouped by section
  instructions: InstructionSection[] | null;
  // Map of the ingredient ID to the ingredient info, used to display per step ingredients
  ingredientMap: Record<string, RecipeIngredientDisplay>;
}

export default function IngredientsAndInstructionsSection({
  containerClassName,
  ingredientSections,
  instructions,
  ingredientMap,
}: IngredientsAndInstructionsSectionProps) {
  const [activeStep, setActiveStep] = useState<Step | null>(null);
  const allStepIds = useMemo(() => {
    return (
      instructions?.flatMap((instruction) =>
        instruction.steps.map((step) => step.id),
      ) || []
    );
  }, [instructions]);

  const getStepStatus = (stepId: string) => {
    const activeStepIndex = activeStep ? allStepIds.indexOf(activeStep.id) : -1;
    const stepIndex = allStepIds.indexOf(stepId);

    if (stepIndex === activeStepIndex) {
      return 'selected';
    }
    if (stepIndex < activeStepIndex) {
      return 'done';
    }
  };

  return (
    <>
      <section className={containerClassName}>
        <h2>Ingredients</h2>
        {ingredientSections?.map((ingredientSection) => (
          <section key={ingredientSection.title}>
            {ingredientSection.title && (
              <h3 className={styles.title}>{ingredientSection.title}</h3>
            )}
            <IngredientsList
              ingredients={ingredientSection.ingredients}
              selectedIngredients={activeStep?.ingredientIds ?? []}
            />
          </section>
        ))}
      </section>
      <InstructionsSection
        instructions={instructions}
        ingredientMap={ingredientMap}
        updateActiveStep={(step) => setActiveStep(step)}
        getStepStatus={getStepStatus}
      />
    </>
  );
}
