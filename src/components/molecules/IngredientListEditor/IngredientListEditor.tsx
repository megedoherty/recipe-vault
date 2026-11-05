import { Draggable, Droppable } from '@hello-pangea/dnd';
import { MoveVertical, X } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import SelectableSearchPopover from '@/components/molecules/SelectableSearchPopover/SelectableSearchPopover';
import {
  IngredientForRecipeEdit,
  RecipeIngredientSectionsEditable,
} from '@/types';

import styles from './IngredientListEditor.module.css';

interface IngredientListEditorProps {
  sectionId: string;
  sectionIndex: number;
  setIngredientSections: Dispatch<
    SetStateAction<RecipeIngredientSectionsEditable[]>
  >;
  section: RecipeIngredientSectionsEditable;
  ingredients: IngredientForRecipeEdit[];
}

export default function IngredientListEditor({
  sectionId,
  sectionIndex,
  setIngredientSections,
  section,
  ingredients,
}: IngredientListEditorProps) {
  const handleFieldChange = (
    sectionIndex: number,
    ingredientIndex: number,
    field: 'name' | 'quantity' | 'ingredientId',
    value: string | null,
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
    <Droppable droppableId={sectionId}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={styles.ingredientsContainer}
        >
          {section.ingredients.map((ingredient, ingredientIndex) => (
            <Draggable
              draggableId={ingredient.id}
              key={ingredient.id}
              index={ingredientIndex}
            >
              {(provided) => (
                <div
                  className={styles.ingredient}
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                >
                  <Button
                    variant="secondary"
                    iconOnly
                    size="small"
                    aria-label="Reorder ingredient"
                    className={styles.dragHandleButton}
                    {...provided.dragHandleProps}
                  >
                    <MoveVertical />
                  </Button>
                  <Input
                    containerClassName={styles.quantityInput}
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
                  <Input
                    label="Ingredient"
                    containerClassName={styles.ingredientInput}
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
                  <SelectableSearchPopover
                    containerClassName={styles.ingredientPickerContainer}
                    popoverId="ingredient-picker-popover"
                    popoverAriaLabel="Ingredient picker"
                    searchPlaceholder="Ingredient name"
                    searchLabel="Search ingredients"
                    searchId="ingredient-picker-search"
                    buttonContent={
                      <span className={styles.ingredientIdButtonText}>
                        {ingredient.ingredientId
                          ? (ingredients.find(
                              (ic) => ic.id === ingredient.ingredientId,
                            )?.name ?? '')
                          : 'Pick ingredient'}
                      </span>
                    }
                    buttonSize="medium"
                    noResultsText="No ingredients found"
                    items={ingredients}
                    groupItems={(items) => {
                      const grouped = Object.groupBy(
                        items,
                        (ingredient) => ingredient.category || '',
                      );
                      return grouped as Record<
                        string,
                        IngredientForRecipeEdit[]
                      >;
                    }}
                    getItemLabel={(ingredient) => ingredient.name}
                    getItemChecked={(itemId) =>
                      ingredient.ingredientId === itemId
                    }
                    onToggleItem={(itemId) => {
                      const newValue =
                        ingredient.ingredientId === itemId ? null : itemId;
                      handleFieldChange(
                        sectionIndex,
                        ingredientIndex,
                        'ingredientId',
                        newValue,
                      );
                    }}
                    buttonClassName={styles.ingredientIdButton}
                  />
                  <Button
                    variant="secondary"
                    iconOnly
                    className={styles.deleteButton}
                    size="small"
                    onClick={() =>
                      handleDeleteIngredient(sectionIndex, ingredientIndex)
                    }
                    aria-label="Delete ingredient"
                  >
                    <X />
                  </Button>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
