import { Dispatch, Fragment, SetStateAction } from 'react';

import Button from '@/components/Button/Button';
import PlusIcon from '@/components/icons/PlusIcon';
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

  return (
    <div className={styles.container}>
      {ingredientSections.map((section, sectionIndex) => {
        return (
          <div key={section.title || sectionIndex} className={styles.section}>
            {section.title && <h3>{section.title}</h3>}
            <div className={styles.ingredients}>
              {section.ingredients.map((ingredient, ingredientIndex) => (
                <Fragment key={ingredient.id}>
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
                </Fragment>
              ))}
            </div>
            <Button
              onClick={() => handleAddIngredient(sectionIndex)}
              size="small"
              className={styles.addButton}
            >
              <PlusIcon /> Add Ingredient
            </Button>
          </div>
        );
      })}
    </div>
  );
}
