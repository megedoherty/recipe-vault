import { RefObject, useCallback, useRef, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import XIcon from '@/components/atoms/icons/XIcon';
import {
  Equipment,
  IngredientForSearch,
  Occasion,
  ServingsRange,
} from '@/types';

import AllUsersFilter from '../AllUsersFilter/AllUsersFilter';
import EquipmentFilter from '../EquipmentFilter/EquipmentFilter';
import IngredientFilter from '../IngredientFilter/IngredientFilter';
import MadeFilter from '../MadeFilter/MadeFilter';
import OccasionFilter from '../OccasionFilter/OccasionFilter';
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
  occasions: Occasion[];
  occasionIdInitialValue: string;
  includeAllUsersInitialValue: boolean;
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
  occasions,
  occasionIdInitialValue,
  formRef,
  includeAllUsersInitialValue,
}: SearchFiltersModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeFilters, setActiveFilters] = useState(() => {
    return [
      ...(includeIngredientsInitialValue.length > 0
        ? ['includeIngredients']
        : []),
      ...(excludeIngredientsInitialValue.length > 0
        ? ['excludeIngredients']
        : []),
      ...(equipmentIdsInitialValue.length > 0 ? ['equipment'] : []),
      ...(minServingsInitialValue !== undefined ? ['minServings'] : []),
      ...(maxServingsInitialValue !== undefined ? ['maxServings'] : []),
      ...(madeInitialValue !== undefined ? ['made'] : []),
      ...(occasionIdInitialValue ? ['occasion'] : []),
      ...(includeAllUsersInitialValue ? ['includeAllUsers'] : []),
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
          <AllUsersFilter
            key={`includeAllUsers-${includeAllUsersInitialValue}`}
            initialValue={includeAllUsersInitialValue}
            updateActiveFilters={updateActiveFilters}
            formRef={formRef}
          />
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
            updateActiveFilters={updateActiveFilters}
            formRef={formRef}
          />

          <IngredientFilter
            key={`exclude-${excludeIngredientsInitialValue.join(',')}`}
            type="Exclude"
            ingredients={ingredients}
            initialValue={excludeIngredientsInitialValue}
            buttonClassName={styles.ingredientFilterButton}
            updateActiveFilters={updateActiveFilters}
            formRef={formRef}
          />
          <EquipmentFilter
            key={`equipment-${equipmentIdsInitialValue.join(',')}`}
            equipment={equipment}
            initialValue={equipmentIdsInitialValue}
            buttonClassName={styles.equipmentFilterButton}
            updateActiveFilters={updateActiveFilters}
            formRef={formRef}
          />
          <OccasionFilter
            key={`occasion-${occasionIdInitialValue}`}
            occasions={occasions}
            initialValue={occasionIdInitialValue}
            labelClassName={styles.label}
            updateActiveFilters={updateActiveFilters}
            formRef={formRef}
          />
        </div>
      </dialog>
    </>
  );
}
