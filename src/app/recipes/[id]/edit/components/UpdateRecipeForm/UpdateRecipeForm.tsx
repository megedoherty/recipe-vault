'use client';

import Form from 'next/form';
import { useActionState, useState } from 'react';

import Button from '@/components/Button/Button';
import TextInput from '@/components/TextInput/TextInput';
import { updateRecipe } from '@/lib/actions/recipes';
import { Recipe } from '@/types';

import ListField from '../ListField/ListField';
import styles from './UpdateRecipeForm.module.css';

interface UpdateRecipeFormComponentProps {
  recipe: Recipe;
}

export default function UpdateRecipeForm({
  recipe,
}: UpdateRecipeFormComponentProps) {
  const [state, formAction, isPending] = useActionState(
    updateRecipe.bind(null, recipe.id),
    null,
  );

  const [ingredients, setIngredients] = useState<string[]>(recipe.ingredients);

  const [instructions, setInstructions] = useState<string[]>(
    recipe.instructions,
  );

  return (
    <Form action={formAction} className={styles.form}>
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
      <ListField
        items={ingredients}
        setItems={setIngredients}
        itemLabel="ingredient"
        fieldType="input"
      />
      <ListField
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
