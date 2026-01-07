'use client';

import Form from 'next/form';
import { useActionState, useMemo, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import TextInput from '@/components/atoms/TextInput/TextInput';
import CategorySelect from '@/components/molecules/CategorySelect/CategorySelect';
import IngredientSectionsEditor from '@/components/organisms/IngredientSectionsEditor/IngredientSectionsEditor';
import InstructionsSectionsEditor from '@/components/organisms/InstructionsSectionsEditor/InstructionsSectionsEditor';
import { addRecipe } from '@/lib/actions/recipes';
import { parseIngredients, parseInstructions } from '@/lib/utils/parse';
import {
  Category,
  IngredientCatalogEntry,
  IngredientSectionsEditable,
  InstructionSection,
} from '@/types';

import ProcessableSection from '../ProcessableSection/ProcessableSection';
import styles from './CreateRecipeForm.module.css';

interface CreateRecipeFormComponentProps {
  categories: Category[];
  ingredientCatalog: IngredientCatalogEntry[];
}

export default function CreateRecipeForm({
  categories,
  ingredientCatalog,
}: CreateRecipeFormComponentProps) {
  const [ingredientSections, setIngredientSections] = useState<
    IngredientSectionsEditable[]
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

  const allIngredients = useMemo(() => {
    return ingredientSections.flatMap((section) => section.ingredients);
  }, [ingredientSections]);

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
            ingredientCatalog={ingredientCatalog}
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
            ingredients={allIngredients}
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
