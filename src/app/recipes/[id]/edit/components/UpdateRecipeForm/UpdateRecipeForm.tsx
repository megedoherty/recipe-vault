'use client';

import Form from 'next/form';
import { useActionState, useState } from 'react';

import Button from '@/components/Button/Button';
import IngredientSectionsEditor from '@/components/IngredientSectionsEditor/IngredientSectionsEditor';
import InstructionsSectionsEditor from '@/components/InstructionsSectionsEditor/InstructionsSectionsEditor';
import TextInput from '@/components/TextInput/TextInput';
import { updateRecipe } from '@/lib/actions/recipes';
import { IngredientSections, InstructionSection, Recipe } from '@/types';

import styles from './UpdateRecipeForm.module.css';

interface UpdateRecipeFormComponentProps {
  recipe: Recipe;
  ingredientSections: IngredientSections[];
}

export default function UpdateRecipeForm({
  recipe,
  ingredientSections,
}: UpdateRecipeFormComponentProps) {
  const [formIngredientSections, setFormIngredientSections] =
    useState<IngredientSections[]>(ingredientSections);
  const [formInstructionSections, setFormInstructionSections] = useState<
    InstructionSection[]
  >(recipe.instructions);

  const [state, formAction, isPending] = useActionState(
    updateRecipe.bind(
      null,
      recipe.id,
      formIngredientSections,
      formInstructionSections,
    ),
    null,
  );

  return (
    <Form action={formAction} className={styles.form}>
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
      <div className={styles.ingredientsContainer}>
        <h2>Ingredients</h2>
        <IngredientSectionsEditor
          ingredientSections={formIngredientSections}
          setIngredientSections={setFormIngredientSections}
        />
      </div>
      <InstructionsSectionsEditor
        instructionSections={formInstructionSections}
        setInstructionSections={setFormInstructionSections}
      />
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
