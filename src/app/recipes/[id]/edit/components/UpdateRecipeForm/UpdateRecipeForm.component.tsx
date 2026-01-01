'use client';

import Form from 'next/form';
import { useActionState } from 'react';

import { updateRecipe } from '@/lib/actions/recipes';
import { Recipe } from '@/types';

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

  return (
    <Form action={formAction}>
      {state?.error && <p>{state.error}</p>}
      <div>
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={recipe.name}
        />
      </div>
      <div>
        <label htmlFor="imageUrl">Image URL</label>
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          defaultValue={recipe.imageUrl ?? ''}
        />
      </div>
      <div>
        <label htmlFor="sourceUrl">Source URL</label>
        <input
          type="url"
          id="sourceUrl"
          name="sourceUrl"
          defaultValue={recipe.sourceUrl ?? ''}
        />
      </div>
      <div>
        <label htmlFor="ingredients">Ingredients</label>
        <textarea
          id="ingredients"
          name="ingredients"
          defaultValue={recipe.ingredients.join('\n')}
        />
      </div>
      <div>
        <label htmlFor="instructions">Instructions</label>
        <textarea
          id="instructions"
          name="instructions"
          defaultValue={recipe.instructions.join('\n')}
        />
      </div>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Updating...' : 'Update Recipe'}
      </button>
    </Form>
  );
}
