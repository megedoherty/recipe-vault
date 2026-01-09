import { Dispatch, SetStateAction } from 'react';

import Button from '@/components/atoms/Button/Button';
import PlusIcon from '@/components/atoms/icons/PlusIcon';
import TrashIcon from '@/components/atoms/icons/TrashIcon';
import TextInput from '@/components/atoms/TextInput/TextInput';
import IngredientListEditor from '@/components/molecules/IngredientListEditor/IngredientListEditor';
import {
  IngredientForRecipeEdit,
  RecipeIngredientSectionsEditable,
} from '@/types';

import styles from './IngredientSectionsEditor.module.css';

interface IngredientSectionsEditorProps {
  ingredientSections: RecipeIngredientSectionsEditable[];
  setIngredientSections: Dispatch<
    SetStateAction<RecipeIngredientSectionsEditable[]>
  >;
  ingredients: IngredientForRecipeEdit[];
}

export default function IngredientSectionsEditor({
  ingredientSections,
  setIngredientSections,
  ingredients,
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
                  ingredientId: null,
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
            ingredientId: null,
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
              <IngredientListEditor
                sectionId={section.id}
                sectionIndex={sectionIndex}
                setIngredientSections={setIngredientSections}
                section={section}
                ingredients={ingredients}
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
