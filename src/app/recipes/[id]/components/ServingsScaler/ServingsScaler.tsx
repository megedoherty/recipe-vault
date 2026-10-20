import Button from '@/components/atoms/Button/Button';

import styles from './ServingsScaler.module.css';

const PRESETS = [0.5, 1, 2, 3];

interface ServingsScalerProps {
  // The servings the recipe was written for
  baseServings: number;
  // The servings currently selected
  servings: number;
  onChange: (servings: number) => void;
}

function formatServings(servings: number): string {
  return String(Math.round(servings * 10) / 10);
}

export default function ServingsScaler({
  baseServings,
  servings,
  onChange,
}: ServingsScalerProps) {
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
      </div>
    </div>
  );
}
