'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { scaleQuantity } from '@/lib/utils/scale';
import {
  InstructionSection,
  RecipeIngredientDisplay,
  RecipeIngredientSections,
  Step,
} from '@/types';

import IngredientsList from '../IngredientsList/IngredientsList';
import InstructionsSection from '../InstructionsSection/InstructionsSection';
import { useServings } from '../ServingsContext/ServingsContext';
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
  const { canScale, factor } = useServings();
  const ingredientsRef = useRef<HTMLDivElement>(null);
  // Ingredient ID -> its list item, so we can scroll to the active step's ingredients
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const registerItem = useCallback(
    (id: string, element: HTMLLIElement | null) => {
      if (element) {
        itemRefs.current.set(id, element);
      } else {
        itemRefs.current.delete(id);
      }
    },
    [],
  );

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

  // Keep the active step's ingredients visible inside the (scrollable) sticky panel.
  // Scrolls the panel only, never the page.
  useEffect(() => {
    const panel = ingredientsRef.current;
    if (!panel || panel.scrollHeight <= panel.clientHeight) return;
    const rects = (activeStep?.ingredientIds ?? [])
      .map((id) => itemRefs.current.get(id)?.getBoundingClientRect())
      .filter((rect): rect is DOMRect => !!rect);
    if (rects.length === 0) return;

    // ingredientIds are in step order, not list order, so find the extremes
    const top = Math.min(...rects.map((rect) => rect.top));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));
    const panelRect = panel.getBoundingClientRect();
    if (top < panelRect.top) {
      panel.scrollTop += top - panelRect.top;
    } else if (bottom > panelRect.bottom) {
      panel.scrollTop += Math.min(
        bottom - panelRect.bottom,
        top - panelRect.top,
      );
    }
  }, [activeStep]);

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
    <div className={styles.layout}>
      <section className={styles.ingredients}>
        <div
          ref={ingredientsRef}
          className={`${containerClassName ?? ''} ${styles.scroller}`}
        >
          <h2>Ingredients</h2>
          {scaledIngredientSections.map((ingredientSection) => (
            <section key={ingredientSection.title}>
              {ingredientSection.title && (
                <h3 className={styles.title}>{ingredientSection.title}</h3>
              )}
              <IngredientsList
                ingredients={ingredientSection.ingredients}
                selectedIngredients={activeStep?.ingredientIds ?? []}
                registerItem={registerItem}
              />
            </section>
          ))}
        </div>
      </section>
      <InstructionsSection
        instructions={instructions}
        ingredientMap={canScale ? scaledIngredientMap : ingredientMap}
        updateActiveStep={(step) => setActiveStep(step)}
        getStepStatus={getStepStatus}
      />
    </div>
  );
}
