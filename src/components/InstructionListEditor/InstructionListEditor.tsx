import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd';
import { Dispatch, SetStateAction } from 'react';

import Button from '@/components/Button/Button';
import UpDownArrowIcon from '@/components/icons/UpDownArrowIcon';
import XIcon from '@/components/icons/XIcon';
import TextInput from '@/components/TextInput/TextInput';
import { InstructionSection } from '@/types';

import styles from './InstructionListEditor.module.css';

interface InstructionListEditorProps {
  sectionId: string;
  sectionIndex: number;
  setInstructionSections: Dispatch<SetStateAction<InstructionSection[]>>;
  section: InstructionSection;
}

export default function InstructionListEditor({
  sectionId,
  sectionIndex,
  setInstructionSections,
  section,
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

  const handleTextChange = (
    sectionIndex: number,
    stepIndex: number,
    value: string,
  ) => {
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

  const handleDeleteStep = (sectionIndex: number, stepIndex: number) => {
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
                        handleTextChange(
                          sectionIndex,
                          stepIndex,
                          e.target.value,
                        )
                      }
                      hideLabel
                    />
                    <Button
                      variant="secondary"
                      iconOnly
                      size="small"
                      onClick={() => handleDeleteStep(sectionIndex, stepIndex)}
                      aria-label="Delete step"
                    >
                      <XIcon />
                    </Button>
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
