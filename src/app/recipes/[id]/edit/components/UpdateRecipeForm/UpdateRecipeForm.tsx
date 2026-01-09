'use client';

import Form from 'next/form';
import { useActionState, useMemo, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import TextInput from '@/components/atoms/TextInput/TextInput';
import CategorySelect from '@/components/molecules/CategorySelect/CategorySelect';
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
}

export default function UpdateRecipeForm({
  recipeId,
  recipe,
  ingredientSections,
  ingredients,
  categories,
  equipment,
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
        <TextInput
          label="Name"
          name="name"
          id="name"
          type="text"
          defaultValue={recipe.name}
          fullWidth
        />
        <TextInput
          label="Source URL"
          name="sourceUrl"
          id="sourceUrl"
          type="url"
          defaultValue={recipe.sourceUrl ?? ''}
          fullWidth
        />
        <TextInput
          label="Image URL"
          name="imageUrl"
          id="imageUrl"
          type="url"
          defaultValue={recipe.imageUrl ?? ''}
          fullWidth
        />
      </section>
      <section className={styles.sectionContainer}>
        <h2>Organization</h2>
        <CategorySelect
          defaultValue={recipe.categoryId?.toString() ?? ''}
          categories={categories}
          showEmptyOption
        />
        <EquipmentSelect
          equipment={equipment}
          selectedEquipment={selectedEquipment}
          setSelectedEquipment={setSelectedEquipment}
        />
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
