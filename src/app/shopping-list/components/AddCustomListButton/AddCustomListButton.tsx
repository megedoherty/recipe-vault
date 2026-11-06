'use client';

import { useRef, useState, useTransition } from 'react';

import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import Dialog, { DialogRef } from '@/components/molecules/Dialog/Dialog';
import ProcessableSection from '@/components/molecules/ProcessableSection/ProcessableSection';
import IngredientSectionsEditor from '@/components/organisms/IngredientSectionsEditor/IngredientSectionsEditor';
import { addCustomListToShoppingList } from '@/lib/actions/shoppingList';
import { ingredientsToText, parseIngredients } from '@/lib/utils/parse';
import {
  IngredientForRecipeEdit,
  RecipeIngredientSectionsEditable,
} from '@/types';

import styles from './AddCustomListButton.module.css';

interface AddCustomListButtonProps {
  // Master ingredients, used to match parsed lines to known ingredients
  ingredientOptions: IngredientForRecipeEdit[];
}

export default function AddCustomListButton({
  ingredientOptions,
}: AddCustomListButtonProps) {
  const dialogRef = useRef<DialogRef>(null);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [sections, setSections] = useState<RecipeIngredientSectionsEditable[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  // Changing the key remounts ProcessableSection so it returns to the paste step
  const [resetKey, setResetKey] = useState(0);

  const items = sections.flatMap((section) =>
    section.ingredients
      .filter((ingredient) => ingredient.name.trim() !== '')
      .map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.quantity,
        ingredientId: ingredient.ingredientId,
      })),
  );

  const reset = () => {
    setName('');
    setSections([]);
    setError(null);
    setResetKey((key) => key + 1);
  };

  const handleAdd = () => {
    setError(null);
    startTransition(async () => {
      const result = await addCustomListToShoppingList(name, items);
      if (!result.success) {
        setError(result.error ?? 'Something went wrong');
        return;
      }
      dialogRef.current?.close();
      reset();
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => dialogRef.current?.showModal()}
      >
        Add Custom List
      </Button>
      <Dialog
        ref={dialogRef}
        title="Add Custom List"
        onClose={() => dialogRef.current?.close()}
        footer={
          <>
            <Button
              onClick={handleAdd}
              disabled={isPending || items.length === 0}
            >
              Add to Shopping List
            </Button>
            <Button
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
          </>
        }
      >
        <div className={styles.content}>
          <Input
            label="List Name (optional)"
            name="customListName"
            id="customListName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <ProcessableSection
            key={resetKey}
            title="Items"
            onProcess={(text) =>
              setSections(parseIngredients(text, ingredientOptions))
            }
            getText={() => ingredientsToText(sections)}
            reprocessWarning="Processing replaces your current rows. Any ingredient matches you chose manually will be reset to our best guess."
            editorComponent={
              <IngredientSectionsEditor
                ingredientSections={sections}
                setIngredientSections={setSections}
                ingredients={ingredientOptions}
              />
            }
          />
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
}
