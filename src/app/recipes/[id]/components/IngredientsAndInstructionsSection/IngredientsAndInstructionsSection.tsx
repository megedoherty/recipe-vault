'use client';

import { useMemo, useState } from 'react';

import { scaleQuantity } from '@/lib/utils/scale';
import {
  InstructionSection,
  RecipeIngredientDisplay,
  RecipeIngredientSections,
  Step,
} from '@/types';

import IngredientsList from '../IngredientsList/IngredientsList';
import InstructionsSection from '../InstructionsSection/InstructionsSection';
import ServingsScaler from '../ServingsScaler/ServingsScaler';
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
  // Servings the recipe was written for, used as the base for scaling
  servings: number | null;
}

export default function IngredientsAndInstructionsSection({
  containerClassName,
  ingredientSections,
  instructions,
  ingredientMap,
  servings,
}: IngredientsAndInstructionsSectionProps) {
  const [activeStep, setActiveStep] = useState<Step | null>(null);
  const [selectedServings, setSelectedServings] = useState(servings ?? 0);
  const canScale = servings != null && servings > 0;
  const factor = canScale ? selectedServings / servings : 1;

  const scaledIngredientSections = useMemo(
    () =>
      ingredientSections.map((section) => ({
        ...section,
        ingredients: section.ingredients.map((ingredient) => ({
          ...ingredient,
          quantity: scaleQuantity(ingredient.quantity, factor),
        })),
      })),
    [ingredientSections, factor],
  );
  const scaledIngredientMap = useMemo(
    () =>
      Object.fromEntries(
        scaledIngredientSections.flatMap((section) =>
          section.ingredients.map((ingredient) => [ingredient.id, ingredient]),
        ),
      ),
    [scaledIngredientSections],
  );
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
        {canScale && (
          <ServingsScaler
            baseServings={servings}
            servings={selectedServings}
            onChange={setSelectedServings}
          />
        )}
        {scaledIngredientSections.map((ingredientSection) => (
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
        ingredientMap={canScale ? scaledIngredientMap : ingredientMap}
        updateActiveStep={(step) => setActiveStep(step)}
        getStepStatus={getStepStatus}
      />
    </>
  );
}
