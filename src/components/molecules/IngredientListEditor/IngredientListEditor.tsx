import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd';
import { Dispatch, SetStateAction } from 'react';

import Button from '@/components/atoms/Button/Button';
import UpDownArrowIcon from '@/components/atoms/icons/UpDownArrowIcon';
import XIcon from '@/components/atoms/icons/XIcon';
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
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.index === destination.index) return;

    setIngredientSections((prev) =>
      prev.map((section) => {
        // Check if this is the section where the drag happened
        if (section.id === source.droppableId) {
          // Create a new ingredients array
          const newIngredients = [...section.ingredients];
          const [movedIngredient] = newIngredients.splice(source.index, 1);
          newIngredients.splice(destination.index, 0, movedIngredient);

          return {
            ...section,
            ingredients: newIngredients,
          };
        }
        return section;
      }),
    );
  };

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
    <DragDropContext onDragEnd={onDragEnd}>
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
                      <UpDownArrowIcon />
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
