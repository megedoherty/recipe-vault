'use client';

import { useId, useMemo, useRef, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import Select from '@/components/atoms/Select/Select';
import Dialog, { DialogRef } from '@/components/molecules/Dialog/Dialog';
import { getMeasurements } from '@/lib/utils/scale';

import type { ScalableIngredient } from '../ServingsContext/ServingsContext';
import styles from './ServingsScaler.module.css';

const PRESETS = [0.5, 1, 2, 3];

interface ServingsScalerProps {
  // The servings the recipe was written for
  baseServings: number;
  // The servings currently selected
  servings: number;
  // Used by the Custom button to scale to an amount you have on hand
  ingredients?: ScalableIngredient[];
  onChange: (servings: number) => void;
}

function formatServings(servings: number): string {
  return String(Math.round(servings * 10) / 10);
}

export default function ServingsScaler({
  baseServings,
  servings,
  ingredients = [],
  onChange,
}: ServingsScalerProps) {
  const dialogRef = useRef<DialogRef>(null);
  const id = useId();
  const [selectedId, setSelectedId] = useState('');
  const [measurementIndex, setMeasurementIndex] = useState(0);
  const [onHand, setOnHand] = useState('');

  // Only ingredients with a single exact amount can be matched
  const options = useMemo(
    () =>
      ingredients.flatMap((ingredient) => {
        const measurements = getMeasurements(ingredient.quantity);
        return measurements.length > 0 ? [{ ingredient, measurements }] : [];
      }),
    [ingredients],
  );
  const hasSections = options.some(({ ingredient }) => ingredient.section);
  const selected =
    options.find((option) => option.ingredient.id === selectedId) ?? options[0];
  const measurement =
    selected?.measurements[measurementIndex] ?? selected?.measurements[0];
  const onHandAmount = Number(onHand);
  const isValid = onHand.trim() !== '' && onHandAmount > 0;

  const openCustom = () => {
    setSelectedId(options[0].ingredient.id);
    setMeasurementIndex(0);
    setOnHand('');
    dialogRef.current?.showModal();
  };

  const applyCustom = () => {
    if (!measurement || !isValid) return;
    onChange(baseServings * (onHandAmount / measurement.amount));
    dialogRef.current?.close();
  };

  return (
    <div className={styles.container}>
      <div className={styles.stepper} role="group" aria-label="Servings">
        <Button
          variant="secondary"
          iconOnly
          className={styles.stepButton}
          aria-label="Decrease servings"
          disabled={servings <= 1}
          onClick={() => onChange(Math.max(1, servings - 1))}
        >
          <span aria-hidden="true">−</span>
        </Button>
        <output className={styles.value}>
          {formatServings(servings)} servings
        </output>
        <Button
          variant="secondary"
          iconOnly
          className={styles.stepButton}
          aria-label="Increase servings"
          onClick={() => onChange(servings + 1)}
        >
          <span aria-hidden="true">+</span>
        </Button>
      </div>
      <div className={styles.presets} role="group" aria-label="Scale recipe">
        {PRESETS.map((multiplier) => {
          const isActive = servings === baseServings * multiplier;
          return (
            <Button
              key={multiplier}
              variant={isActive ? 'primary' : 'secondary'}
              className={`${styles.preset} ${isActive ? styles.active : ''}`}
              onClick={() => onChange(baseServings * multiplier)}
            >
              {multiplier === 0.5 ? '½' : multiplier}x
            </Button>
          );
        })}
        {options.length > 0 && (
          <Button
            variant="secondary"
            className={`${styles.preset} ${styles.custom}`}
            onClick={openCustom}
          >
            Custom
          </Button>
        )}
      </div>
      {selected && measurement && (
        <Dialog
          ref={dialogRef}
          title="Scale to what you have"
          onClose={() => dialogRef.current?.close()}
          footer={
            <>
              <Button disabled={!isValid} onClick={applyCustom}>
                Scale
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
          <form
            className={styles.customForm}
            onSubmit={(event) => {
              event.preventDefault();
              applyCustom();
            }}
          >
            <Select
              id={`${id}-ingredient`}
              name="ingredient"
              label="Ingredient"
              direction="vertical"
              value={selected.ingredient.id}
              onChange={(event) => {
                setSelectedId(event.target.value);
                setMeasurementIndex(0);
              }}
              options={options.map(({ ingredient }) => ({
                value: ingredient.id,
                label: ingredient.name,
                group: hasSections
                  ? (ingredient.section ?? 'Other')
                  : undefined,
              }))}
            />
            {selected.measurements.length > 1 && (
              <Select
                id={`${id}-measurement`}
                name="measurement"
                label="Measurement"
                direction="vertical"
                value={String(selected.measurements.indexOf(measurement))}
                onChange={(event) =>
                  setMeasurementIndex(Number(event.target.value))
                }
                options={selected.measurements.map(({ unit }, index) => ({
                  value: String(index),
                  label: unit || 'whole',
                }))}
              />
            )}
            <Input
              id={`${id}-amount`}
              name="amount"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              label={`Amount you have${measurement.unit ? ` (${measurement.unit})` : ''}`}
              placeholder={`Recipe calls for ${selected.ingredient.quantity}`}
              value={onHand}
              onChange={(event) => setOnHand(event.target.value)}
            />
          </form>
        </Dialog>
      )}
    </div>
  );
}
