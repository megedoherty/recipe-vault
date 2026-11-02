'use client';

import { useServings } from '../ServingsContext/ServingsContext';
import ServingsScaler from '../ServingsScaler/ServingsScaler';

// The servings control shown with the recipe info. It drives the ingredient
// quantities through the shared servings context.
export default function RecipeServings() {
  const { servings, setServings, baseServings, canScale } = useServings();

  if (!canScale) return null;

  return (
    <ServingsScaler
      baseServings={baseServings}
      servings={servings}
      onChange={setServings}
    />
  );
}
