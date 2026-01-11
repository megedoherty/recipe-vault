import { RefObject, useCallback, useRef, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import XIcon from '@/components/atoms/icons/XIcon';
import { Equipment, IngredientForSearch, ServingsRange } from '@/types';

import EquipmentFilter from '../EquipmentFilter/EquipmentFilter';
import IngredientFilter from '../IngredientFilter/IngredientFilter';
import MadeFilter from '../MadeFilter/MadeFilter';
import RatingFilter from '../RatingFilter/RatingFilter';
import ServingsFilter from '../ServingsFilter/ServingsFilter';
import styles from './SearchFiltersModal.module.css';

interface SearchFiltersModalProps {
  ingredients: IngredientForSearch[];
  equipment: Equipment[];
  excludeIngredientsInitialValue: string[];
  includeIngredientsInitialValue: string[];
  equipmentIdsInitialValue: string[];
  minServingsInitialValue?: number;
  maxServingsInitialValue?: number;
  madeInitialValue?: 'yes' | 'no';
  servingsRange: ServingsRange;
  ratingInitialValue?: number;
  formRef: RefObject<HTMLFormElement | null>;
}

export default function SearchFiltersModal({
  ingredients,
  equipment,
  excludeIngredientsInitialValue,
  equipmentIdsInitialValue,
  includeIngredientsInitialValue,
  minServingsInitialValue,
  maxServingsInitialValue,
  madeInitialValue,
  ratingInitialValue,
  servingsRange,
  formRef,
}: SearchFiltersModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeFilters, setActiveFilters] = useState(() => {
    return [
      ...(excludeIngredientsInitialValue.length > 0
        ? ['excludeIngredients']
        : []),
      ...(equipmentIdsInitialValue.length > 0 ? ['equipment'] : []),
      ...(minServingsInitialValue !== undefined ? ['minServings'] : []),
      ...(maxServingsInitialValue !== undefined ? ['maxServings'] : []),
      ...(madeInitialValue !== undefined ? ['made'] : []),
    ];
  });

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
          <MadeFilter
            labelClassName={styles.label}
            updateActiveFilters={updateActiveFilters}
            initialValue={madeInitialValue}
            formRef={formRef}
            key={`made-${madeInitialValue}`}
          />
          <RatingFilter
            ratingInitialValue={ratingInitialValue ?? 0}
            updateActiveFilters={updateActiveFilters}
            labelClassName={styles.label}
            formRef={formRef}
          />
          <ServingsFilter
            key={`servings-${minServingsInitialValue}-${maxServingsInitialValue}`}
            minInitialValue={minServingsInitialValue}
            maxInitialValue={maxServingsInitialValue}
            containerClassName={styles.servingsFilterContainer}
            labelClassName={styles.label}
            servingsRange={servingsRange}
            updateActiveFilters={updateActiveFilters}
            formRef={formRef}
          />
          <IngredientFilter
            key={`include-${includeIngredientsInitialValue.join(',')}`}
            type="Include"
            ingredients={ingredients}
            initialValue={includeIngredientsInitialValue}
            buttonClassName={styles.ingredientFilterButton}
          />

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
