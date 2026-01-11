'use client';

import Form from 'next/form';
import { useActionState, useMemo, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import Select from '@/components/atoms/Select/Select';
import CategorySelect from '@/components/molecules/CategorySelect/CategorySelect';
import StorageInfoEditor from '@/components/molecules/StorageInfoEditor/StorageInfoEditor';
import EquipmentSelect from '@/components/organisms/EquipmentSelect/EquipmentSelect';
import IngredientSectionsEditor from '@/components/organisms/IngredientSectionsEditor/IngredientSectionsEditor';
import InstructionsSectionsEditor from '@/components/organisms/InstructionsSectionsEditor/InstructionsSectionsEditor';
import { addRecipe } from '@/lib/actions/recipes';
import { parseIngredients, parseInstructions } from '@/lib/utils/parse';
import {
  Category,
  Equipment,
  IngredientForRecipeEdit,
  InstructionSection,
  MealType,
  Occasion,
  RecipeIngredientSectionsEditable,
} from '@/types';

import ProcessableSection from '../ProcessableSection/ProcessableSection';
import styles from './CreateRecipeForm.module.css';

interface CreateRecipeFormComponentProps {
  categories: Category[];
  ingredients: IngredientForRecipeEdit[];
  equipment: Equipment[];
  mealTypes: MealType[];
  occasions: Occasion[];
}

export default function CreateRecipeForm({
  categories,
  ingredients,
  equipment,
  mealTypes,
  occasions,
}: CreateRecipeFormComponentProps) {
  const [ingredientSections, setIngredientSections] = useState<
    RecipeIngredientSectionsEditable[]
  >([]);
  const [instructionSections, setInstructionSections] = useState<
    InstructionSection[]
  >([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  const [state, formAction, isPending] = useActionState(
    addRecipe.bind(
      null,
      ingredientSections,
      instructionSections,
      selectedEquipment,
    ),
    null,
  );

  const onProcessIngredients = (ingredientsInput: string) => {
    const parsedSections = parseIngredients(ingredientsInput, ingredients);
    setIngredientSections(parsedSections);
  };

  const onProcessInstructions = (instructionsInput: string) => {
    const parsedSections = parseInstructions(instructionsInput);
    setInstructionSections(parsedSections);
  };

  const allIngredients = useMemo(() => {
    return ingredientSections.flatMap((section) => section.ingredients);
  }, [ingredientSections]);

  return (
    <Form action={formAction} className={styles.form}>
      {state?.error && <p>{state.error}</p>}
      <Input
        label="Name"
        name="name"
        id="name"
        type="text"
        required
        fullWidth
      />
      <section className={styles.sectionContainer}>
        <h2>Organization and Details</h2>
        <Select
          label="Meal Type"
          name="mealTypeId"
          id="mealType"
          defaultValue=""
          options={mealTypes.map((mealType) => ({
            value: mealType.id.toString(),
            label: mealType.name,
          }))}
          emptyOption={{ value: '', label: 'Select a meal type' }}
        />
        <CategorySelect categories={categories} showEmptyOption />
        <Select
          label="Occasion"
          name="occasionId"
          id="occasionId"
          defaultValue=""
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
          direction="horizontal"
          inputClassName={styles.servingsInput}
          min={0}
        />
        <EquipmentSelect
          equipment={equipment}
          selectedEquipment={selectedEquipment}
          setSelectedEquipment={setSelectedEquipment}
        />
        <StorageInfoEditor
          storage={[
            {
              location: 'Room Temperature',
              days: null,
            },
            {
              location: 'Fridge',
              days: null,
            },
          ]}
        />
      </section>
      <ProcessableSection
        title="Ingredients"
        onProcess={onProcessIngredients}
        editorComponent={
          <IngredientSectionsEditor
            ingredientSections={ingredientSections}
            setIngredientSections={setIngredientSections}
            ingredients={ingredients}
          />
        }
      />
      <ProcessableSection
        title="Instructions"
        onProcess={onProcessInstructions}
        editorComponent={
          <InstructionsSectionsEditor
            instructionSections={instructionSections}
            setInstructionSections={setInstructionSections}
            ingredients={allIngredients}
          />
        }
      />
      <section className={styles.sectionContainer}>
        <h2>Notes</h2>
        <Input
          label="Notes"
          name="notes"
          id="notes"
          type="textarea"
          hideLabel
        />
      </section>
      <Button
        variant="primary"
        type="submit"
        disabled={
          isPending ||
          ingredientSections.length === 0 ||
          instructionSections.length === 0
        }
        className={styles.submitButton}
      >
        {isPending ? 'Adding...' : 'Add Recipe'}
      </Button>
    </Form>
  );
}
