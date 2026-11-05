import { InstructionSection } from '@/types';

/**
 * Removes ingredient links from instruction steps when the ingredient is no
 * longer part of the recipe, so a step never points at an ingredient that was
 * deleted.
 *
 * Returns the original array (same reference) when nothing needs removing, so
 * it is safe to use in a memo without triggering needless re-renders.
 */
export default function unlinkMissingIngredients(
  instructionSections: InstructionSection[],
  existingIngredientIds: ReadonlySet<string>,
): InstructionSection[] {
  const isStale = (id: string) => !existingIngredientIds.has(id);

  const hasStaleLink = instructionSections.some((section) =>
    section.steps.some((step) => step.ingredientIds?.some(isStale)),
  );
  if (!hasStaleLink) {
    return instructionSections;
  }

  return instructionSections.map((section) => ({
    ...section,
    steps: section.steps.map((step) =>
      step.ingredientIds?.some(isStale)
        ? {
            ...step,
            ingredientIds: step.ingredientIds.filter((id) => !isStale(id)),
          }
        : step,
    ),
  }));
}
