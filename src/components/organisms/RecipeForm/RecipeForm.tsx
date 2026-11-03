'use client';

import Form from 'next/form';
import { useActionState, useMemo, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import Select from '@/components/atoms/Select/Select';
import CategorySelect from '@/components/molecules/CategorySelect/CategorySelect';
import ImagePicker from '@/components/molecules/ImagePicker/ImagePicker';
import ProcessableSection from '@/components/molecules/ProcessableSection/ProcessableSection';
import StorageInfoEditor from '@/components/molecules/StorageInfoEditor/StorageInfoEditor';
import EquipmentSelect from '@/components/organisms/EquipmentSelect/EquipmentSelect';
import IngredientSectionsEditor from '@/components/organisms/IngredientSectionsEditor/IngredientSectionsEditor';
import InstructionsSectionsEditor from '@/components/organisms/InstructionsSectionsEditor/InstructionsSectionsEditor';
import { defaultStorage } from '@/constants';
import { addRecipe, updateRecipe } from '@/lib/actions/recipes';
import {
  ingredientsToText,
  instructionsToText,
  parseIngredients,
  parseInstructions,
} from '@/lib/utils/parse';
import {
  Category,
  EditableRecipe,
  Equipment,
  IngredientForRecipeEdit,
  InstructionSection,
  MealType,
  Occasion,
  RecipeIngredientSectionsEditable,
} from '@/types';

import styles from './RecipeForm.module.css';

interface RecipeFormProps {
  mode: 'create' | 'update';
  recipeId?: string;
  initialRecipe?: EditableRecipe;
  initialIngredientSections?: RecipeIngredientSectionsEditable[];
  categories: Category[];
  ingredients: IngredientForRecipeEdit[];
  equipment: Equipment[];
  mealTypes: MealType[];
  occasions: Occasion[];
  imageOptions?: string[];
}

export default function RecipeForm({
  mode,
  recipeId,
  initialRecipe,
  initialIngredientSections,
  categories,
  ingredients,
  equipment,
  mealTypes,
  occasions,
  imageOptions,
}: RecipeFormProps) {
  const [ingredientSections, setIngredientSections] = useState<
    RecipeIngredientSectionsEditable[]
  >(initialIngredientSections ?? []);
  const [instructionSections, setInstructionSections] = useState<
    InstructionSection[]
  >(initialRecipe?.instructions ?? []);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(
    initialRecipe?.equipmentIds ?? [],
  );

  const isCreateMode = mode === 'create';

  const actionFunction = isCreateMode
    ? addRecipe.bind(
        null,
        ingredientSections,
        instructionSections,
        selectedEquipment,
      )
    : updateRecipe.bind(
        null,
        recipeId!,
        ingredientSections,
        instructionSections,
        selectedEquipment,
      );

  const [state, formAction, isPending] = useActionState(actionFunction, null);

  const onProcessIngredients = (ingredientsInput: string) => {
    const parsedSections = parseIngredients(ingredientsInput, ingredients);
    setIngredientSections(parsedSections);
  };

  const onProcessInstructions = (instructionsInput: string) => {
    const parsedSections = parseInstructions(instructionsInput);
    setInstructionSections(parsedSections);
  };

  const allIngredients = useMemo(() => {
    // Derive each ingredient's section from its parent section's current title,
    // since ingredient.section is only a snapshot and goes stale when the
    // section title is edited (or the ingredient was created before it was named).
    return ingredientSections.flatMap((section) =>
      section.ingredients.map((ingredient) => ({
        ...ingredient,
        section: section.title,
      })),
    );
  }, [ingredientSections]);

  return (
    <Form action={formAction} className={styles.form}>
      <section className={styles.sectionContainer}>
        <h2>Basic Information</h2>
        <Input
          label="Recipe Name"
          name="name"
          id="recipeName"
          type="text"
          defaultValue={initialRecipe?.name ?? ''}
          required={isCreateMode}
          fullWidth
        />
        <Input
          label="Source URL"
          name="sourceUrl"
          id="sourceUrl"
          type="url"
          defaultValue={initialRecipe?.sourceUrl ?? ''}
          fullWidth
        />
        <ImagePicker
          imageOptions={imageOptions}
          initialValue={initialRecipe?.imageUrl ?? ''}
        />
      </section>
      <section className={styles.sectionContainer}>
        <h2>Organization and Details</h2>
        <Select
          label="Meal Type"
          name="mealTypeId"
          id="mealType"
          defaultValue={initialRecipe?.mealTypeId?.toString() ?? ''}
          options={mealTypes.map((mealType) => ({
            value: mealType.id.toString(),
            label: mealType.name,
          }))}
          emptyOption={{ value: '', label: 'Select a meal type' }}
        />
        <CategorySelect
          defaultValue={initialRecipe?.categoryId?.toString() ?? ''}
          categories={categories}
          showEmptyOption
        />
        <Select
          label="Occasion"
          name="occasionId"
          id="occasionId"
          defaultValue={initialRecipe?.occasionId?.toString() ?? ''}
          options={occasions.map((occasion) => ({
            value: occasion.id.toString(),
            label: occasion.name,
          }))}
          emptyOption={{ value: '', label: 'Select an occasion' }}
        />
        <Input
          label="Servings"
          name="servings"
          id="servings"
          type="number"
          defaultValue={initialRecipe?.servings?.toString() ?? ''}
          direction="horizontal"
          inputClassName={styles.servingsInput}
          min={0}
        />
        <EquipmentSelect
          equipment={equipment}
          selectedEquipment={selectedEquipment}
          setSelectedEquipment={setSelectedEquipment}
        />
        <StorageInfoEditor storage={initialRecipe?.storage ?? defaultStorage} />
      </section>
      {isCreateMode ? (
        <ProcessableSection
          title="Ingredients"
          onProcess={onProcessIngredients}
          initialProcessed={ingredientSections.length > 0}
          getText={() => ingredientsToText(ingredientSections)}
          reprocessWarning="Processing replaces your current rows. Any ingredient matches you chose manually will be reset to our best guess."
          editorComponent={
            <IngredientSectionsEditor
              ingredientSections={ingredientSections}
              setIngredientSections={setIngredientSections}
              ingredients={ingredients}
            />
          }
        />
      ) : (
        <section className={styles.sectionContainer}>
          <h2>Ingredients</h2>
          <IngredientSectionsEditor
            ingredientSections={ingredientSections}
            setIngredientSections={setIngredientSections}
            ingredients={ingredients}
          />
        </section>
      )}
      {isCreateMode ? (
        <ProcessableSection
          title="Instructions"
          onProcess={onProcessInstructions}
          initialProcessed={instructionSections.length > 0}
          getText={() => instructionsToText(instructionSections)}
          reprocessWarning="Processing replaces your current steps. Any ingredients you linked to individual steps will be removed."
          editorComponent={
            <InstructionsSectionsEditor
              instructionSections={instructionSections}
              setInstructionSections={setInstructionSections}
              ingredients={allIngredients}
            />
          }
        />
      ) : (
        <section className={styles.sectionContainer}>
          <h2>Instructions</h2>
          <InstructionsSectionsEditor
            instructionSections={instructionSections}
            setInstructionSections={setInstructionSections}
            ingredients={allIngredients}
          />
        </section>
      )}
      <section className={styles.sectionContainer}>
        <h2>Notes</h2>
        <Input
          label="Notes"
          name="notes"
          id="notes"
          type="textarea"
          defaultValue={initialRecipe?.notes ?? ''}
          hideLabel
        />
      </section>
      {state?.error && <p>{state.error}</p>}
      <Button
        variant="primary"
        type="submit"
        disabled={
          isPending ||
          (isCreateMode &&
            (ingredientSections.length === 0 ||
              instructionSections.length === 0))
        }
        className={styles.submitButton}
      >
        {isPending
          ? isCreateMode
            ? 'Adding...'
            : 'Updating...'
          : isCreateMode
            ? 'Add Recipe'
            : 'Update Recipe'}
      </Button>
    </Form>
  );
}
