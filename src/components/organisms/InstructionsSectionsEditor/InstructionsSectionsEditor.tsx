import { Dispatch, SetStateAction } from 'react';

import Button from '@/components/atoms/Button/Button';
import PlusIcon from '@/components/atoms/icons/PlusIcon';
import TrashIcon from '@/components/atoms/icons/TrashIcon';
import TextInput from '@/components/atoms/TextInput/TextInput';
import InstructionListEditor from '@/components/molecules/InstructionListEditor/InstructionListEditor';
import { InstructionSection } from '@/types';

import styles from './InstructionsSectionsEditor.module.css';

interface InstructionsSectionsEditorProps {
  instructionSections: InstructionSection[];
  setInstructionSections: Dispatch<SetStateAction<InstructionSection[]>>;
}

export default function IngredientSectionsEditor({
  instructionSections,
  setInstructionSections,
}: InstructionsSectionsEditorProps) {
  const handleAddInstruction = (sectionIndex: number) => {
    setInstructionSections((prev) =>
      prev.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              steps: [
                ...section.steps,
                {
                  text: '',
                  id: crypto.randomUUID(),
                },
              ],
            }
          : section,
      ),
    );
  };

  const handleSectionTitleChange = (sectionIndex: number, value: string) => {
    setInstructionSections((prev) =>
      prev.map((section, sIdx) =>
        sIdx === sectionIndex ? { ...section, title: value } : section,
      ),
    );
  };

  const handleAddSection = () => {
    setInstructionSections((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: null,
        steps: [
          {
            text: '',
            id: crypto.randomUUID(),
          },
        ],
      },
    ]);
  };

  const handleDeleteSection = (sectionIndex: number) => {
    setInstructionSections((prev) => prev.filter((_, i) => i !== sectionIndex));
  };

  return (
    <div className={styles.container}>
      {instructionSections.map((section, sectionIndex) => {
        return (
          <div key={section.id} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Section {sectionIndex + 1}</h3>
              <Button
                variant="secondary"
                iconOnly
                onClick={() => handleDeleteSection(sectionIndex)}
                aria-label="Delete section"
              >
                <TrashIcon />
              </Button>
            </div>
            <TextInput
              label="Title"
              name={`section-${sectionIndex}`}
              id={`section-${sectionIndex}`}
              type="text"
              value={section.title || ''}
              onChange={(e) =>
                handleSectionTitleChange(sectionIndex, e.target.value)
              }
            />
            <div className={styles.instructions}>
              <p>Instructions</p>
              <InstructionListEditor
                sectionId={section.id}
                sectionIndex={sectionIndex}
                setInstructionSections={setInstructionSections}
                section={section}
              />
            </div>
            <Button
              onClick={() => handleAddInstruction(sectionIndex)}
              size="small"
              className={styles.addButton}
            >
              Add Step
            </Button>
          </div>
        );
      })}
      <Button
        onClick={handleAddSection}
        size="small"
        className={styles.addSectionButton}
      >
        <PlusIcon /> Add Section
      </Button>
    </div>
  );
}
