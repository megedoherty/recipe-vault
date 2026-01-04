import { useEffect, useRef, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import Checkbox from '@/components/atoms/Checkbox/Checkbox';
import TextInput from '@/components/atoms/TextInput/TextInput';
import { EditableIngredient } from '@/types';

import styles from './IngredientPicker.module.css';

interface IngredientPickerProps {
  allIngredients: EditableIngredient[];
  selectedIngredientIds: string[];
  onToggleIngredient: (ingredientId: string) => void;
}

export default function IngredientPicker({
  allIngredients,
  selectedIngredientIds,
  onToggleIngredient,
}: IngredientPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        !popoverRef.current?.contains(e.target as Node) &&
        !containerRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const filteredIngredients = allIngredients.filter(
    (ingredient) =>
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.quantity?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const groupedBySection = Object.groupBy(
    filteredIngredients,
    (ingredient) => ingredient.section || '',
  );

  return (
    <div className={styles.container} ref={containerRef}>
      <Button
        variant="secondary"
        size="small"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="ingredient-picker-popover"
      >
        Add ingredients
      </Button>
      {isOpen && (
        <div
          className={styles.popoverContainer}
          ref={popoverRef}
          id="ingredient-picker-popover"
          role="listbox"
          aria-label="Ingredient picker"
        >
          <div className={styles.inputContainer}>
            <TextInput
              label="Search ingredients"
              placeholder="Ingredient name or quantity"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              id="ingredient-picker-search"
              name="ingredient-picker-search"
              type="text"
              hideLabel
            />
          </div>
          <div className={styles.ingredientList}>
            {filteredIngredients.length === 0 ? (
              <div className={styles.noIngredients}>
                <p>No ingredients found</p>
              </div>
            ) : (
              Object.entries(groupedBySection).map(([section, ingredients]) => {
                if (ingredients?.length === 0) return null;
                return (
                  <div
                    key={section}
                    className={styles.ingredientSection}
                    role="group"
                    aria-label={section || 'Ingredients'}
                  >
                    {section && (
                      <div className={styles.sectionName}>{section}</div>
                    )}
                    <div className={styles.ingredientsContainer}>
                      {ingredients?.map((ingredient) => (
                        <Checkbox
                          key={ingredient.id}
                          label={`${ingredient.quantity ?? ''} ${ingredient.name}`.trim()}
                          checkboxSize="small"
                          labelSize="small"
                          onChange={() => onToggleIngredient(ingredient.id)}
                          id={ingredient.id}
                          checked={selectedIngredientIds.includes(
                            ingredient.id,
                          )}
                          checkboxClassName={styles.checkbox}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
