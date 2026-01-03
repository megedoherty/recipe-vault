'use client';

import Form from 'next/form';
import { useActionState, useState } from 'react';

import Button from '@/components/Button/Button';
import IngredientSectionsEditor from '@/components/IngredientSectionsEditor/IngredientSectionsEditor';
import TextInput from '@/components/TextInput/TextInput';
import { updateRecipe } from '@/lib/actions/recipes';
import { IngredientSections, Recipe } from '@/types';

import ListField from '../ListField/ListField';
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
  const [instructions, setInstructions] = useState<string[]>(
    recipe.instructions,
  );

  const [state, formAction, isPending] = useActionState(
    updateRecipe.bind(null, recipe.id, formIngredientSections),
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
        label="Image URL"
        name="imageUrl"
        id="imageUrl"
        type="url"
        defaultValue={recipe.imageUrl ?? ''}
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
      <div className={styles.ingredientsContainer}>
        <h2>Ingredients</h2>
        <IngredientSectionsEditor
          ingredientSections={formIngredientSections}
          setIngredientSections={setFormIngredientSections}
        />
      </div>
      <ListField
        heading="Instructions"
        items={instructions}
        setItems={setInstructions}
        itemLabel="instruction"
        fieldType="textarea"
        extraInfo="Warning: Any instructions with new lines will be split and treated as separate instructions."
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
