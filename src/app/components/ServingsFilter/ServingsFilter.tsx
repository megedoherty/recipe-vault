'use client';

import { ChangeEvent, RefObject, useEffect, useState } from 'react';

import Input from '@/components/atoms/Input/Input';
import { ServingsRange } from '@/types';

import styles from './ServingsFilter.module.css';

interface ServingsFilterProps {
  minInitialValue?: number;
  maxInitialValue?: number;
  containerClassName?: string;
  labelClassName?: string;
  servingsRange: ServingsRange;
  updateActiveFilters: (filterName: string, isActive: boolean) => void;
  formRef: RefObject<HTMLFormElement | null>;
}

export default function ServingsFilter({
  minInitialValue,
  maxInitialValue,
  containerClassName,
  labelClassName,
  servingsRange,
  updateActiveFilters,
  formRef,
}: ServingsFilterProps) {
  const [minValue, setMinValue] = useState<number | undefined>(minInitialValue);
  const [maxValue, setMaxValue] = useState<number | undefined>(maxInitialValue);

  const handleMinChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : Number(e.target.value);
    setMinValue(value);
    updateActiveFilters('minServings', value !== undefined && value > 0);
  };

  const handleMaxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : Number(e.target.value);
    setMaxValue(value);
    updateActiveFilters('maxServings', value !== undefined && value > 0);
  };

  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const handleReset = () => {
      setMinValue(undefined);
      setMaxValue(undefined);
      updateActiveFilters('minServings', false);
      updateActiveFilters('maxServings', false);
    };

    form.addEventListener('reset', handleReset);

    return () => {
      form.removeEventListener('reset', handleReset);
    };
  }, [formRef, updateActiveFilters]);

  // Validate: min should be <= max (only if both are set)
  const isValid =
    minValue === undefined ||
    maxValue === undefined ||
    (typeof minValue === 'number' &&
      typeof maxValue === 'number' &&
      minValue <= maxValue);

  const errorMessage =
    !isValid && minValue !== undefined && maxValue !== undefined
      ? 'Minimum must be less than or equal to maximum. This filter will be ignored.'
      : null;

  return (
    <div className={containerClassName}>
      <p className={labelClassName}>Number of servings</p>
      <div className={styles.rangeContainer}>
        <Input
          label="Minimum number of servings"
          type="number"
          name="minServings"
          id="minServings"
          placeholder="Min"
          value={minValue ?? ''}
          onChange={handleMinChange}
          hideLabel
          className={styles.numberInput}
          min={servingsRange.min}
          max={servingsRange.max}
          aria-invalid={!isValid}
          aria-describedby={errorMessage ? 'servings-error' : undefined}
          hasError={!isValid}
        />
        <span>to</span>
        <Input
          label="Maximum number of servings"
          type="number"
          name="maxServings"
          id="maxServings"
          placeholder="Max"
          value={maxValue ?? ''}
          onChange={handleMaxChange}
          hideLabel
          className={styles.numberInput}
          min={servingsRange.min}
          max={servingsRange.max}
          aria-invalid={!isValid}
          aria-describedby={errorMessage ? 'servings-error' : undefined}
          hasError={!isValid}
        />
      </div>
      {errorMessage && (
        <p id="servings-error" className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
