import { Dispatch, SetStateAction } from 'react';

import Button from '@/components/Button/Button';
import PlusIcon from '@/components/icons/PlusIcon';
import TrashIcon from '@/components/icons/TrashIcon';
import XIcon from '@/components/icons/XIcon';
import TextInput from '@/components/TextInput/TextInput';
import { IngredientSections } from '@/types';

import styles from './IngredientsInput.module.css';

interface IngredientsInputProps {
  ingredientSections: IngredientSections[];
  setIngredientSections: Dispatch<SetStateAction<IngredientSections[]>>;
}

export default function IngredientsInput({
  ingredientSections,
  setIngredientSections,
}: IngredientsInputProps) {
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

  const handleFieldChange = (
    sectionIndex: number,
    ingredientIndex: number,
    field: 'name' | 'quantity',
    value: string,
  ) => {
    setIngredientSections((prev) =>
      prev.map((section, sIdx) =>
        sIdx === sectionIndex
          ? {
              ...section,
              ingredients: section.ingredients.map((ingredient, iIdx) =>
                iIdx === ingredientIndex
                  ? { ...ingredient, [field]: value }
                  : ingredient,
              ),
            }
          : section,
      ),
    );
  };

  const handleDeleteIngredient = (
    sectionIndex: number,
    ingredientIndex: number,
  ) => {
    setIngredientSections((prev) =>
      prev.map((section, sIdx) =>
        sIdx === sectionIndex
          ? {
              ...section,
              ingredients: section.ingredients.filter(
                (_, i) => i !== ingredientIndex,
              ),
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
              {section.ingredients.map((ingredient, ingredientIndex) => (
                <div key={ingredient.id} className={styles.ingredient}>
                  <TextInput
                    label="Quantity"
                    name={`${section.title}-quantity-${ingredientIndex}`}
                    id={`${section.title}-quantity-${ingredientIndex}`}
                    type="text"
                    value={ingredient.quantity || ''}
                    onChange={(e) =>
                      handleFieldChange(
                        sectionIndex,
                        ingredientIndex,
                        'quantity',
                        e.target.value,
                      )
                    }
                    hideLabel
                  />
                  <TextInput
                    label="Ingredient"
                    name={`section-${section.title}-ingredient-${ingredientIndex}`}
                    id={`${section.title}-ingredient-${ingredientIndex}`}
                    type="text"
                    value={ingredient.name}
                    onChange={(e) =>
                      handleFieldChange(
                        sectionIndex,
                        ingredientIndex,
                        'name',
                        e.target.value,
                      )
                    }
                    hideLabel
                  />
                  <Button
                    variant="secondary"
                    iconOnly
                    size="small"
                    onClick={() =>
                      handleDeleteIngredient(sectionIndex, ingredientIndex)
                    }
                    aria-label="Delete ingredient"
                  >
                    <XIcon />
                  </Button>
                </div>
              ))}
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
