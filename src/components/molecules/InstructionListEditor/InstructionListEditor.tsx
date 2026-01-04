import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd';
import { Dispatch, SetStateAction } from 'react';

import Button from '@/components/atoms/Button/Button';
import Chip from '@/components/atoms/Chip/Chip';
import UpDownArrowIcon from '@/components/atoms/icons/UpDownArrowIcon';
import XIcon from '@/components/atoms/icons/XIcon';
import TextInput from '@/components/atoms/TextInput/TextInput';
import { EditableIngredient, InstructionSection } from '@/types';

import IngredientPicker from '../IngredientPicker/IngredientPicker';
import styles from './InstructionListEditor.module.css';

interface InstructionListEditorProps {
  sectionId: string;
  sectionIndex: number;
  setInstructionSections: Dispatch<SetStateAction<InstructionSection[]>>;
  section: InstructionSection;
  ingredients: EditableIngredient[];
}

const getChipLabel = (ingredient: EditableIngredient | undefined) => {
  return ingredient?.quantity
    ? `${ingredient.quantity} ${ingredient.name}`
    : ingredient?.name;
};

export default function InstructionListEditor({
  sectionId,
  sectionIndex,
  setInstructionSections,
  section,
  ingredients,
}: InstructionListEditorProps) {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.index === destination.index) return;

    setInstructionSections((prev) =>
      prev.map((section) => {
        // Check if this is the section where the drag happened
        if (section.id === source.droppableId) {
          const newSteps = [...section.steps];
          const [movedStep] = newSteps.splice(source.index, 1);
          newSteps.splice(destination.index, 0, movedStep);

          return {
            ...section,
            steps: newSteps,
          };
        }
        return section;
      }),
    );
  };

  const handleTextChange = (stepIndex: number, value: string) => {
    setInstructionSections((prev) =>
      prev.map((section, sIdx) =>
        sIdx === sectionIndex
          ? {
              ...section,
              steps: section.steps.map((step, iIdx) =>
                iIdx === stepIndex ? { ...step, text: value } : step,
              ),
            }
          : section,
      ),
    );
  };

  const handleDeleteStep = (stepIndex: number) => {
    setInstructionSections((prev) =>
      prev.map((section, sIdx) =>
        sIdx === sectionIndex
          ? {
              ...section,
              steps: section.steps.filter((_, i) => i !== stepIndex),
            }
          : section,
      ),
    );
  };

  const handleToggleIngredient = (stepIndex: number, ingredientId: string) => {
    setInstructionSections((prev) =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIndex) {
          return section;
        }

        const modifiedStep = { ...section.steps[stepIndex] };
        if (modifiedStep.ingredientIds?.includes(ingredientId)) {
          modifiedStep.ingredientIds = modifiedStep.ingredientIds?.filter(
            (id) => id !== ingredientId,
          );
        } else {
          modifiedStep.ingredientIds = [
            ...(modifiedStep.ingredientIds || []),
            ingredientId,
          ];
        }
        return {
          ...section,
          steps: section.steps.map((step, iIdx) =>
            iIdx === stepIndex ? modifiedStep : step,
          ),
        };
      }),
    );
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
                        <IngredientPicker
                          allIngredients={ingredients}
                          selectedIngredientIds={step.ingredientIds || []}
                          onToggleIngredient={(ingredientId) =>
                            handleToggleIngredient(stepIndex, ingredientId)
                          }
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
