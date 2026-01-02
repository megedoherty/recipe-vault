'use client';

import Form from 'next/form';
import { useActionState } from 'react';

import Button from '@/components/Button/Button';
import TextInput from '@/components/TextInput/TextInput';
import { addRecipe } from '@/lib/actions/recipes';

import styles from './CreateRecipeForm.module.css';

export default function CreateRecipeForm() {
  const [state, formAction, isPending] = useActionState(addRecipe, null);

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
      <TextInput
        label="Ingredients"
        name="ingredients"
        id="ingredients"
        type="textarea"
        fullWidth
      />
      <TextInput
        label="Instructions"
        name="instructions"
        id="instructions"
        type="textarea"
        fullWidth
      />
      <Button
        variant="primary"
        type="submit"
        disabled={isPending}
        className={styles.submitButton}
      >
        {isPending ? 'Adding...' : 'Add Recipe'}
      </Button>
    </Form>
  );
}
