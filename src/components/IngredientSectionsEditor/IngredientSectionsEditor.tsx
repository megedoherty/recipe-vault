import { Dispatch, SetStateAction } from 'react';

import Button from '@/components/Button/Button';
import PlusIcon from '@/components/icons/PlusIcon';
import TrashIcon from '@/components/icons/TrashIcon';
import TextInput from '@/components/TextInput/TextInput';
import { IngredientSections } from '@/types';

import DraggableIngredientEditor from '../IngredientListEditor/IngredientListEditor';
import styles from './IngredientSectionsEditor.module.css';

interface IngredientSectionsEditorProps {
  ingredientSections: IngredientSections[];
  setIngredientSections: Dispatch<SetStateAction<IngredientSections[]>>;
}

export default function IngredientSectionsEditor({
  ingredientSections,
  setIngredientSections,
}: IngredientSectionsEditorProps) {
  const handleAddIngredient = (sectionIndex: number) => {
    setIngredientSections((prev) =>
      prev.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              ingredients: [
                ...section.ingredients,
                {
                  name: '',
                  quantity: '',
                  id: crypto.randomUUID(),
                  section: section.title,
                },
              ],
            }
          : section,
      ),
    );
  };

  const handleSectionTitleChange = (sectionIndex: number, value: string) => {
    setIngredientSections((prev) =>
      prev.map((section, sIdx) =>
        sIdx === sectionIndex ? { ...section, title: value } : section,
      ),
    );
  };

  const handleAddSection = () => {
    setIngredientSections((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: null,
        ingredients: [
          {
            name: '',
            quantity: '',
            id: crypto.randomUUID(),
            section: '',
          },
        ],
      },
    ]);
  };

  const handleDeleteSection = (sectionIndex: number) => {
    setIngredientSections((prev) => prev.filter((_, i) => i !== sectionIndex));
  };

  return (
    <div className={styles.container}>
      {ingredientSections.map((section, sectionIndex) => {
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
            <div className={styles.ingredients}>
              <p>Ingredients</p>
              <DraggableIngredientEditor
                sectionId={section.id}
                sectionIndex={sectionIndex}
                setIngredientSections={setIngredientSections}
                section={section}
              />
            </div>
            <Button
              onClick={() => handleAddIngredient(sectionIndex)}
              size="small"
              className={styles.addButton}
            >
              Add Ingredient
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
