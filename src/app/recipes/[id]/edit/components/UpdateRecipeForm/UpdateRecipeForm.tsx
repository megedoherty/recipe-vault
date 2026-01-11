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
import { updateRecipe } from '@/lib/actions/recipes';
import {
  Category,
  EditableRecipe,
  Equipment,
  IngredientForRecipeEdit,
  InstructionSection,
  MealType,
  RecipeIngredientSectionsEditable,
} from '@/types';

import styles from './UpdateRecipeForm.module.css';

interface UpdateRecipeFormComponentProps {
  recipeId: string;
  recipe: EditableRecipe;
  ingredientSections: RecipeIngredientSectionsEditable[];
  categories: Category[];
  ingredients: IngredientForRecipeEdit[];
  equipment: Equipment[];
  mealTypes: MealType[];
}

export default function UpdateRecipeForm({
  recipeId,
  recipe,
  ingredientSections,
  ingredients,
  categories,
  equipment,
  mealTypes,
}: UpdateRecipeFormComponentProps) {
  const [formIngredientSections, setFormIngredientSections] =
    useState<RecipeIngredientSectionsEditable[]>(ingredientSections);
  const [formInstructionSections, setFormInstructionSections] = useState<
    InstructionSection[]
  >(recipe.instructions);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(
    recipe.equipmentIds,
  );

  const [state, formAction, isPending] = useActionState(
    updateRecipe.bind(
      null,
      recipeId,
      formIngredientSections,
      formInstructionSections,
      selectedEquipment,
    ),
    null,
  );

  const allIngredients = useMemo(() => {
    return formIngredientSections.flatMap((section) => section.ingredients);
  }, [formIngredientSections]);

  return (
    <Form action={formAction} className={styles.form}>
      <section className={styles.sectionContainer}>
        <h2>Basic Information</h2>
        <Input
          label="Name"
          name="name"
          id="name"
          type="text"
          defaultValue={recipe.name}
          fullWidth
        />
        <Input
          label="Source URL"
          name="sourceUrl"
          id="sourceUrl"
          type="url"
          defaultValue={recipe.sourceUrl ?? ''}
          fullWidth
        />
        <Input
          label="Image URL"
          name="imageUrl"
          id="imageUrl"
          type="url"
          defaultValue={recipe.imageUrl ?? ''}
          fullWidth
        />
      </section>
      <section className={styles.sectionContainer}>
        <h2>Organization and Details</h2>
        <Select
          label="Meal Type"
          name="mealTypeId"
          id="mealType"
          options={mealTypes.map((mealType) => ({
            value: mealType.id.toString(),
            label: mealType.name,
          }))}
          defaultValue={recipe.mealTypeId?.toString() ?? ''}
          emptyOption={{ value: '', label: 'Select a meal type' }}
        />
        <CategorySelect
          defaultValue={recipe.categoryId?.toString() ?? ''}
          categories={categories}
          showEmptyOption
        />
        <Input
          label="Servings"
          name="servings"
          id="servings"
          type="number"
          defaultValue={recipe.servings?.toString() ?? ''}
          direction="horizontal"
          inputClassName={styles.servingsInput}
          min={0}
        />
        <EquipmentSelect
          equipment={equipment}
          selectedEquipment={selectedEquipment}
          setSelectedEquipment={setSelectedEquipment}
        />
        <StorageInfoEditor storage={recipe.storage} />
      </section>
      <section className={styles.sectionContainer}>
        <h2>Ingredients</h2>
        <IngredientSectionsEditor
          ingredientSections={formIngredientSections}
          setIngredientSections={setFormIngredientSections}
          ingredients={ingredients}
        />
      </section>
      <section className={styles.sectionContainer}>
        <h2>Instructions</h2>
        <InstructionsSectionsEditor
          instructionSections={formInstructionSections}
          setInstructionSections={setFormInstructionSections}
          ingredients={allIngredients}
        />
      </section>
      <section className={styles.sectionContainer}>
        <h2>Notes</h2>
        <Input
          label="Notes"
          name="notes"
          id="notes"
          type="textarea"
          hideLabel
          defaultValue={recipe.notes ?? ''}
        />
      </section>
      {state?.error && <p>{state.error}</p>}
      <Button
        variant="primary"
        type="submit"
        disabled={isPending}
        className={styles.submitButton}
      >
        {isPending ? 'Updating...' : 'Update Recipe'}
      </Button>
    </Form>
  );
}
