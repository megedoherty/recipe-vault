'use client';

import Form from 'next/form';
import { useActionState, useState } from 'react';

import Button from '@/components/Button/Button';
import PlusIcon from '@/components/icons/PlusIcon';
import XIcon from '@/components/icons/XIcon';
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
      <div className={styles.inputContainer}>
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={recipe.name}
          className={styles.input}
        />
      </div>
      <div className={styles.inputContainer}>
        <label htmlFor="imageUrl">Image URL</label>
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          defaultValue={recipe.imageUrl ?? ''}
          className={styles.input}
        />
      </div>
      <div className={styles.inputContainer}>
        <label htmlFor="sourceUrl">Source URL</label>
        <input
          type="url"
          id="sourceUrl"
          name="sourceUrl"
          defaultValue={recipe.sourceUrl ?? ''}
          className={styles.input}
        />
      </div>
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
