import { Fragment, useState } from 'react';

import Button from '@/components/Button/Button';
import Hint from '@/components/Hint/Hint';
import PlusIcon from '@/components/icons/PlusIcon';
import TextInput from '@/components/TextInput/TextInput';
import { DEFAULT_SECTION_NAME } from '@/lib/utils/constants';
import { ParsedSection, parseIngredients } from '@/lib/utils/parse';

import styles from './IngredientsInput.module.css';

interface IngredientsInputProps {
  hasProcessed: boolean;
  setHasProcessed: (value: boolean) => void;
}

export default function IngredientsInput({
  hasProcessed,
  setHasProcessed,
}: IngredientsInputProps) {
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [sections, setSections] = useState<ParsedSection[]>([]);

  const onClick = () => {
    const parsedSections = parseIngredients(ingredientsInput);
    setSections(parsedSections);
    setHasProcessed(true);
  };

  const handleAddIngredient = (sectionIndex: number) => {
    setSections((prev) => {
      const newSections = [...prev];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        ingredients: [
          ...newSections[sectionIndex].ingredients,
          { name: '', quantity: null },
        ],
      };
      return newSections;
    });
  };

  return (
    <div className={styles.container}>
      <p>Ingredients</p>
      <Hint>
        Enter your ingredients one per line. If a section applies, end it with a
        colon. We&apos;ll turn your list into editable rows so you can review,
        edit, and add to before saving.
      </Hint>
      {!hasProcessed ? (
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
          <Button size="small" onClick={onClick}>
            Process Ingredients
          </Button>
        </>
      ) : (
        sections.map((section, index) => {
          const sectionName = section.name || DEFAULT_SECTION_NAME;
          return (
            <div key={sectionName} className={styles.section}>
              {section.name && <h3>{section.name}</h3>}
              <div className={styles.ingredients}>
                {section.ingredients.map((ingredient, index) => (
                  <Fragment key={`${ingredient.name}-${index}`}>
                    <TextInput
                      label="Quantity"
                      name={`section-${sectionName}-quantity-${index}`}
                      id={`${sectionName}-quantity-${index}`}
                      type="text"
                      defaultValue={ingredient.quantity || ''}
                      hideLabel
                    />
                    <TextInput
                      label="Ingredient"
                      name={`section-${sectionName}-ingredient-${index}`}
                      id={`${sectionName}-ingredient-${index}`}
                      type="text"
                      defaultValue={ingredient.name}
                      hideLabel
                    />
                  </Fragment>
                ))}
              </div>
              <Button
                onClick={() => handleAddIngredient(index)}
                size="small"
                className={styles.addButton}
              >
                <PlusIcon /> Add Ingredient
              </Button>
            </div>
          );
        })
      )}
    </div>
  );
}
