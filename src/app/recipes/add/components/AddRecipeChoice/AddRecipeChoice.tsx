'use client';

import { useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import RecipeForm from '@/components/organisms/RecipeForm/RecipeForm';
import { parseRecipeFromUrl } from '@/lib/actions/recipeParser/recipeParser';
import {
  Category,
  Equipment,
  IngredientForRecipeEdit,
  MealType,
  Occasion,
  ParsedRecipe,
} from '@/types';

import styles from './AddRecipeChoice.module.css';

interface AddRecipeChoiceProps {
  categories: Category[];
  ingredients: IngredientForRecipeEdit[];
  equipment: Equipment[];
  mealTypes: MealType[];
  occasions: Occasion[];
}

type AddMode = null | 'url' | 'manual';

export default function AddRecipeChoice({
  categories,
  ingredients,
  equipment,
  mealTypes,
  occasions,
}: AddRecipeChoiceProps) {
  const [mode, setMode] = useState<AddMode>(null);
  const [recipeUrl, setRecipeUrl] = useState('');
  const [recipe, setRecipe] = useState<ParsedRecipe | null>(null);

  const fetchAndParseRecipe = async () => {
    const parsedRecipe = await parseRecipeFromUrl(
      recipeUrl,
      ingredients,
      categories,
      mealTypes,
    );
    setRecipe(parsedRecipe);
    setMode('manual');
  };

  if (mode === null) {
    return (
      <div className={styles.choiceContainer}>
        <h2>How would you like to add a recipe?</h2>
        <div className={styles.buttonGroup}>
          <Button
            variant="primary"
            onClick={() => setMode('url')}
            className={styles.choiceButton}
          >
            Add from URL
          </Button>
          <Button
            variant="secondary"
            onClick={() => setMode('manual')}
            className={styles.choiceButton}
          >
            Add Manually
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'url') {
    return (
      <div className={styles.urlContainer}>
        <h2>Add Recipe from URL</h2>
        <div className={styles.urlInputContainer}>
          <Input
            type="url"
            name="recipeUrl"
            label="Recipe URL"
            id="recipeUrl"
            value={recipeUrl}
            onChange={(e) => setRecipeUrl(e.target.value)}
            placeholder="https://example.com/recipe"
          />
          <Button
            variant="primary"
            onClick={fetchAndParseRecipe}
            disabled={!recipeUrl.trim()}
            className={styles.fetchButton}
          >
            Fetch Recipe
          </Button>
        </div>
      </div>
    );
  }

  if (
    recipe?.recipe.name === '' ||
    recipe?.ingredients.length === 0 ||
    recipe?.recipe.instructions.length === 0
  ) {
    console.group('Error parsing recipe');
    console.error('Missing recipe name, ingredients, or instructions');
    console.info('Recipe:', recipe);
    console.groupEnd();

    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>
          Error parsing recipe. Please enter manually and tell Meghan to
          investigate.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.manualContainer}>
      <h2>Add Recipe</h2>
      <RecipeForm
        mode="create"
        categories={categories}
        ingredients={ingredients}
        equipment={equipment}
        mealTypes={mealTypes}
        imageOptions={recipe?.imageUrls ?? []}
        occasions={occasions}
        initialRecipe={recipe?.recipe ?? undefined}
        initialIngredientSections={recipe?.ingredients}
      />
    </div>
  );
}
