'use client';

import Form from 'next/form';
import { useActionState, useState } from 'react';

import Button from '@/components/Button/Button';
import IngredientSectionsEditor from '@/components/IngredientSectionsEditor/IngredientSectionsEditor';
import InstructionsSectionsEditor from '@/components/InstructionsSectionsEditor/InstructionsSectionsEditor';
import Select from '@/components/Select/Select';
import TextInput from '@/components/TextInput/TextInput';
import { updateRecipe } from '@/lib/actions/recipes';
import {
  Category,
  IngredientSections,
  InstructionSection,
  Recipe,
} from '@/types';

import styles from './UpdateRecipeForm.module.css';

interface UpdateRecipeFormComponentProps {
  recipe: Recipe;
  ingredientSections: IngredientSections[];
  categories: Category[];
}

export default function UpdateRecipeForm({
  recipe,
  ingredientSections,
  categories,
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
        <div>
          <Select
            label="Category"
            name="categoryId"
            id="category"
            defaultValue={recipe.category?.id.toString() ?? ''}
            options={categories.map((category) => ({
              value: category.id.toString(),
              label: category.name,
            }))}
            emptyOption={{ value: '', label: 'Select a category' }}
          />
        </div>
      </section>
      <section className={styles.sectionContainer}>
        <h2>Ingredients</h2>
        <IngredientSectionsEditor
          ingredientSections={formIngredientSections}
          setIngredientSections={setFormIngredientSections}
        />
      </section>
      <section className={styles.sectionContainer}>
        <h2>Instructions</h2>
        <InstructionsSectionsEditor
          instructionSections={formInstructionSections}
          setInstructionSections={setFormInstructionSections}
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
