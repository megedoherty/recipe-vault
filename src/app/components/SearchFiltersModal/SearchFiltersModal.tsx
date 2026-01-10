import { useCallback, useRef, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import XIcon from '@/components/atoms/icons/XIcon';
import { Equipment, IngredientForSearch } from '@/types';

import EquipmentFilter from '../EquipmentFilter/EquipmentFilter';
import IngredientFilter from '../IngredientFilter/IngredientFilter';
import styles from './SearchFiltersModal.module.css';

interface SearchFiltersModalProps {
  ingredients: IngredientForSearch[];
  equipment: Equipment[];
  excludeIngredientsInitialValue: string[];
  equipmentIdsInitialValue: string[];
}

export default function SearchFiltersModal({
  ingredients,
  equipment,
  excludeIngredientsInitialValue,
  equipmentIdsInitialValue,
}: SearchFiltersModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeFilters, setActiveFilters] = useState(() => [
    ...(excludeIngredientsInitialValue.length > 0
      ? ['excludeIngredients']
      : []),
    ...(equipmentIdsInitialValue.length > 0 ? ['equipment'] : []),
  ]);

  const updateActiveFilters = useCallback(
    (filterName: string, isActive: boolean) => {
      setActiveFilters((prev) => {
        if (isActive) {
          return prev.includes(filterName) ? prev : [...prev, filterName];
        } else {
          return prev.filter((f) => f !== filterName);
        }
      });
    },
    [],
  );

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => dialogRef.current?.showModal()}
        className={styles.button}
      >
        {`Additional Filters ${activeFilters.length > 0 ? `(${activeFilters.length})` : ''}`}
      </Button>
      <dialog
        ref={dialogRef}
        onClose={() => dialogRef.current?.close()}
        className={styles.dialog}
        closedby="any"
      >
        <div className={styles.content}>
          <header className={styles.header}>
            <h2>Additional Filters</h2>
            <Button iconOnly onClick={() => dialogRef.current?.close()}>
              <XIcon />
            </Button>
          </header>
          <IngredientFilter
            key={`exclude-${excludeIngredientsInitialValue.join(',')}`}
            type="Exclude"
            ingredients={ingredients}
            initialValue={excludeIngredientsInitialValue}
            buttonClassName={styles.ingredientFilterButton}
            updateActiveFilters={updateActiveFilters}
          />
          <EquipmentFilter
            key={`equipment-${equipmentIdsInitialValue.join(',')}`}
            equipment={equipment}
            initialValue={equipmentIdsInitialValue}
            buttonClassName={styles.equipmentFilterButton}
            updateActiveFilters={updateActiveFilters}
          />
        </div>
      </dialog>
    </>
  );
}
