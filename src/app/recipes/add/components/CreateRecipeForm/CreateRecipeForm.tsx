'use client';

import Form from 'next/form';
import { useActionState, useState } from 'react';

import Button from '@/components/Button/Button';
import CategorySelect from '@/components/CategorySelect/CategorySelect';
import IngredientSectionsEditor from '@/components/IngredientSectionsEditor/IngredientSectionsEditor';
import InstructionsSectionsEditor from '@/components/InstructionsSectionsEditor/InstructionsSectionsEditor';
import TextInput from '@/components/TextInput/TextInput';
import { addRecipe } from '@/lib/actions/recipes';
import { parseIngredients, parseInstructions } from '@/lib/utils/parse';
import { Category, IngredientSections, InstructionSection } from '@/types';

import ProcessableSection from '../ProcessableSection/ProcessableSection';
import styles from './CreateRecipeForm.module.css';

interface CreateRecipeFormComponentProps {
  categories: Category[];
}

export default function CreateRecipeForm({
  categories,
}: CreateRecipeFormComponentProps) {
  const [ingredientSections, setIngredientSections] = useState<
    IngredientSections[]
  >([]);
  const [instructionSections, setInstructionSections] = useState<
    InstructionSection[]
  >([]);

  const [state, formAction, isPending] = useActionState(
    addRecipe.bind(null, ingredientSections, instructionSections),
    null,
  );

  const onProcessIngredients = (ingredientsInput: string) => {
    const parsedSections = parseIngredients(ingredientsInput);
    setIngredientSections(parsedSections);
  };

  const onProcessInstructions = (instructionsInput: string) => {
    const parsedSections = parseInstructions(instructionsInput);
    setInstructionSections(parsedSections);
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
      <section className={styles.sectionContainer}>
        <h2>Organization</h2>
        <CategorySelect categories={categories} showEmptyOption />
      </section>
      <ProcessableSection
        title="Ingredients"
        onProcess={onProcessIngredients}
        editorComponent={
          <IngredientSectionsEditor
            ingredientSections={ingredientSections}
            setIngredientSections={setIngredientSections}
          />
        }
      />
      <ProcessableSection
        title="Instructions"
        onProcess={onProcessInstructions}
        editorComponent={
          <InstructionsSectionsEditor
            instructionSections={instructionSections}
            setInstructionSections={setInstructionSections}
          />
        }
      />
      <Button
        variant="primary"
        type="submit"
        disabled={
          isPending ||
          ingredientSections.length === 0 ||
          instructionSections.length === 0
        }
        className={styles.submitButton}
      >
        {isPending ? 'Adding...' : 'Add Recipe'}
      </Button>
    </Form>
  );
}
