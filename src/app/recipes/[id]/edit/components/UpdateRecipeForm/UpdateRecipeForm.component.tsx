'use client';

import Form from 'next/form';
import { useActionState, useState } from 'react';

import Button from '@/components/Button/Button.component';
import { XIcon } from '@/components/icons/XIcon';
import { updateRecipe } from '@/lib/actions/recipes';
import { Recipe } from '@/types';

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

  const handleDeleteIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteInstruction = (index: number) => {
    setInstructions((prev) => prev.filter((_, i) => i !== index));
  };

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
      <div className={styles.ingredientsContainer}>
        <p>Ingredients</p>
        {ingredients.map((ingredient, index) => (
          <div key={ingredient} className={styles.ingredient}>
            <input
              type="text"
              name="ingredient"
              id={`ingredient-${index}`}
              defaultValue={ingredient}
              className={styles.input}
            />
            <label htmlFor={`ingredient-${index}`} className="sr-only">
              Ingredient {index + 1}
            </label>
            <Button
              variant="secondary"
              onClick={() => handleDeleteIngredient(index)}
              iconOnly
              aria-label="Delete ingredient"
            >
              <XIcon />
            </Button>
          </div>
        ))}
      </div>
      <div className={styles.instructionsContainer}>
        <p>Instructions</p>
        {instructions.map((instruction, index) => (
          <div key={instruction} className={styles.instruction}>
            <textarea
              name="instruction"
              id={`instruction-${index}`}
              defaultValue={instruction}
              className={styles.textarea}
              rows={4}
            />
            <label htmlFor={`instruction-${index}`} className="sr-only">
              Instruction {index + 1}
            </label>
            <Button
              variant="secondary"
              onClick={() => handleDeleteInstruction(index)}
              iconOnly
              aria-label="Delete instruction"
            >
              <XIcon />
            </Button>
          </div>
        ))}
      </div>
      {state?.error && <p>{state.error}</p>}
      <Button variant="primary" type="submit" disabled={isPending}>
        {isPending ? 'Updating...' : 'Update Recipe'}
      </Button>
    </Form>
  );
}
