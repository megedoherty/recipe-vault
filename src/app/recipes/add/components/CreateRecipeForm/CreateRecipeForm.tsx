'use client';

import Form from 'next/form';
import { useActionState, useState } from 'react';

import Button from '@/components/Button/Button';
import TextInput from '@/components/TextInput/TextInput';
import { addRecipe } from '@/lib/actions/recipes';

import IngredientsInput from '../IngredientsInput/IngredientsInput';
import styles from './CreateRecipeForm.module.css';

export default function CreateRecipeForm() {
  const [state, formAction, isPending] = useActionState(addRecipe, null);
  const [ingredientsProcessed, setIngredientsProcessed] = useState(false);

  return (
    <Form action={formAction} className={styles.form}>
      {state?.error && <p>{state.error}</p>}
      <TextInput
        label="Name"
        name="name"
        id="name"
        type="text"
        required
        fullWidth
      />
      <IngredientsInput
        hasProcessed={ingredientsProcessed}
        setHasProcessed={setIngredientsProcessed}
      />
      {!ingredientsProcessed ? (
        <p>Please add and process your ingredients before adding the recipe.</p>
      ) : (
        <TextInput
          label="Instructions"
          name="instructions"
          id="instructions"
          type="textarea"
          fullWidth
        />
      )}
      <Button
        variant="primary"
        type="submit"
        disabled={isPending || !ingredientsProcessed}
        className={styles.submitButton}
      >
        {isPending ? 'Adding...' : 'Add Recipe'}
      </Button>
    </Form>
  );
}
