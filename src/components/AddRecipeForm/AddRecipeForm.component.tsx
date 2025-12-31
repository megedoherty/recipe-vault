'use client';

import Form from 'next/form';
import { useActionState } from 'react';

import { addRecipe } from '@/lib/actions';

export default function AddRecipeFormComponent() {
  const [state, formAction, isPending] = useActionState(addRecipe, null);

  return (
    <Form action={formAction}>
      {state?.error && <p>{state.error}</p>}
      {state?.success && <p>Recipe added successfully</p>}
      <div>
        <label htmlFor="name">Name</label>
        <input type="text" id="name" name="name" required />
      </div>
      <div>
        <label htmlFor="ingredients">Ingredients</label>
        <textarea id="ingredients" name="ingredients" />
      </div>
      <div>
        <label htmlFor="instructions">Instructions</label>
        <textarea id="instructions" name="instructions" />
      </div>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Adding...' : 'Add Recipe'}
      </button>
    </Form>
  );
}
