'use client';

import Form from 'next/form';
import { useActionState, useState } from 'react';

import Button from '@/components/Button/Button';
import Hint from '@/components/Hint/Hint';
import IngredientSectionsEditor from '@/components/IngredientSectionsEditor/IngredientSectionsEditor';
import TextInput from '@/components/TextInput/TextInput';
import { addRecipe } from '@/lib/actions/recipes';
import { parseIngredients } from '@/lib/utils/parse';
import { IngredientSections } from '@/types';

import styles from './CreateRecipeForm.module.css';

export default function CreateRecipeForm() {
  const [ingredientsProcessed, setIngredientsProcessed] = useState(false);
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [ingredientSections, setIngredientSections] = useState<
    IngredientSections[]
  >([]);

  const [state, formAction, isPending] = useActionState(
    addRecipe.bind(null, ingredientSections),
    null,
  );

  const onProcessIngredients = () => {
    const parsedSections = parseIngredients(ingredientsInput);
    setIngredientSections(parsedSections);
    setIngredientsProcessed(true);
  };

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
      <div className={styles.ingredientsContainer}>
        <p>Ingredients</p>
        <Hint>
          Enter your ingredients one per line. If a section applies, end it with
          a colon. We&apos;ll turn your list into editable rows so you can
          review, edit, and add to before saving.
        </Hint>
        {!ingredientsProcessed ? (
          <>
            <TextInput
              label="Ingredients"
              name="ingredients"
              id="ingredients"
              value={ingredientsInput}
              onChange={(e) => setIngredientsInput(e.target.value)}
              type="textarea"
              fullWidth
            />
            <Button size="small" onClick={onProcessIngredients}>
              Process Ingredients
            </Button>
          </>
        ) : (
          <IngredientSectionsEditor
            ingredientSections={ingredientSections}
            setIngredientSections={setIngredientSections}
          />
        )}
      </div>
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
