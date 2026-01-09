import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd';

import Button from '@/components/atoms/Button/Button';
import Chip from '@/components/atoms/Chip/Chip';
import UpDownArrowIcon from '@/components/atoms/icons/UpDownArrowIcon';
import XIcon from '@/components/atoms/icons/XIcon';
import TextInput from '@/components/atoms/TextInput/TextInput';
import SelectableSearchPopover from '@/components/molecules/SelectableSearchPopover/SelectableSearchPopover';
import { InstructionSection, RecipeEditableIngredient } from '@/types';

import styles from './InstructionListEditor.module.css';

interface InstructionListEditorProps {
  sectionId: string;
  setSection: (
    updater: (section: InstructionSection) => InstructionSection,
  ) => void;
  section: InstructionSection;
  ingredients: RecipeEditableIngredient[];
}

const getChipLabel = (ingredient: RecipeEditableIngredient | undefined) => {
  return ingredient?.quantity
    ? `${ingredient.quantity} ${ingredient.name}`
    : ingredient?.name;
};

export default function InstructionListEditor({
  sectionId,
  setSection,
  section,
  ingredients,
}: InstructionListEditorProps) {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.index === destination.index) return;

    setSection((section) => {
      const newSteps = [...section.steps];
      const [movedStep] = newSteps.splice(source.index, 1);
      newSteps.splice(destination.index, 0, movedStep);
      return {
        ...section,
        steps: newSteps,
      };
    });
  };

  const handleTextChange = (stepIndex: number, value: string) => {
    setSection((section) => ({
      ...section,
      steps: section.steps.map((step, iIdx) =>
        iIdx === stepIndex ? { ...step, text: value } : step,
      ),
    }));
  };

  const handleDeleteStep = (stepIndex: number) => {
    setSection((section) => ({
      ...section,
      steps: section.steps.filter((_, i) => i !== stepIndex),
    }));
  };

  const handleToggleIngredient = (stepIndex: number, ingredientId: string) => {
    setSection((section) => {
      const updatedSteps = section.steps.map((step, iIdx) => {
        if (iIdx !== stepIndex) {
          return step;
        }

        const currentIds = step.ingredientIds || [];
        const isChecked = currentIds.includes(ingredientId);

        return {
          ...step,
          ingredientIds: isChecked
            ? currentIds.filter((id) => id !== ingredientId)
            : [...currentIds, ingredientId],
        };
      });

      return {
        ...section,
        steps: updatedSteps,
      };
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={sectionId}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={styles.stepsContainer}
          >
            {section.steps.map((step, stepIndex) => (
              <Draggable draggableId={step.id} key={step.id} index={stepIndex}>
                {(provided) => (
                  <div
                    className={styles.step}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                  >
                    <Button
                      variant="secondary"
                      iconOnly
                      size="small"
                      aria-label="Reorder step"
                      {...provided.dragHandleProps}
                    >
                      <UpDownArrowIcon />
                    </Button>
                    <TextInput
                      label="Step"
                      name={`${section.title}-step-${stepIndex}`}
                      id={`${section.title}-step-${stepIndex}`}
                      type="textarea"
                      value={step.text || ''}
                      onChange={(e) =>
                        handleTextChange(stepIndex, e.target.value)
                      }
                      hideLabel
                    />
                    <Button
                      variant="secondary"
                      iconOnly
                      size="small"
                      onClick={() => handleDeleteStep(stepIndex)}
                      aria-label="Delete step"
                    >
                      <XIcon />
                    </Button>
                    <div className={styles.linkedIngredientsContainer}>
                      <div className={styles.linkedIngredientsHeader}>
                        <p className={styles.linkedIngredientsLabel}>
                          Ingredients used:
                        </p>
                        <SelectableSearchPopover<RecipeEditableIngredient>
                          popoverId="ingredient-picker-popover"
                          popoverAriaLabel="Ingredient picker"
                          searchPlaceholder="Ingredient name"
                          searchLabel="Search ingredients"
                          searchId="ingredient-picker-search"
                          buttonContent="Add ingredients"
                          noResultsText="No ingredients found"
                          items={ingredients}
                          groupItems={(items) => {
                            const grouped = Object.groupBy(
                              items,
                              (ingredient) => ingredient.section || '',
                            );

                            return grouped as Record<
                              string,
                              RecipeEditableIngredient[]
                            >;
                          }}
                          getItemLabel={(ingredient) =>
                            `${ingredient.quantity ?? ''} ${ingredient.name}`.trim()
                          }
                          getItemChecked={(itemId) =>
                            step.ingredientIds?.includes(itemId) || false
                          }
                          onToggleItem={(ingredientId) =>
                            handleToggleIngredient(stepIndex, ingredientId)
                          }
                          canSelectMultiple={true}
                        />
                      </div>
                      {step.ingredientIds && step.ingredientIds.length > 0 && (
                        <div className={styles.linkedIngredientsList}>
                          {step.ingredientIds?.map((ingredientId) => (
                            <Chip
                              key={ingredientId}
                              onClick={() =>
                                handleToggleIngredient(stepIndex, ingredientId)
                              }
                            >
                              {getChipLabel(
                                ingredients.find(
                                  (ingredient) =>
                                    ingredient.id === ingredientId,
                                ),
                              )}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
