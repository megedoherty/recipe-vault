'use client';

import { useState } from 'react';

import Alert from '@/components/atoms/Alert/Alert';
import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import DuplicateRecipeAlert from '@/components/molecules/DuplicateRecipeAlert/DuplicateRecipeAlert';
import RecipeForm from '@/components/organisms/RecipeForm/RecipeForm';
import { parseRecipeFromUrl } from '@/lib/actions/recipeParser/recipeParser';
import { checkDuplicateRecipe } from '@/lib/actions/recipes';
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
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchAndParseRecipe = async () => {
    setIsFetching(true);
    setFetchError(null);
    setDuplicate(null);

    try {
      // Check before scraping so a known duplicate costs no fetch
      const existing = await checkDuplicateRecipe(recipeUrl);
      if (existing) {
        setDuplicate(existing);
        return;
      }

      const parsedRecipe = await parseRecipeFromUrl(
        recipeUrl,
        ingredients,
        categories,
        mealTypes,
        equipment,
      );

      // The page may declare a canonical URL different from the one typed
      const canonical = parsedRecipe.recipe.sourceUrl;
      if (canonical) {
        const existingCanonical = await checkDuplicateRecipe(canonical);
        if (existingCanonical) {
          setDuplicate(existingCanonical);
          return;
        }
      }

      setRecipe(parsedRecipe);
      setMode('manual');
    } catch (error) {
      console.error(error);
      setFetchError(
        'Could not fetch that recipe. Check the URL and try again.',
      );
    } finally {
      setIsFetching(false);
    }
  };

  const switchToManual = () => {
    setRecipe(null);
    setMode('manual');
  };

  const goBack = () => {
    setRecipe(null);
    setMode(null);
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
        <div className={styles.header}>
          <h2>Add Recipe from URL</h2>
          <Button variant="secondary" size="small" onClick={goBack}>
            Back
          </Button>
        </div>
        <div className={styles.urlInputContainer}>
          <Input
            type="url"
            name="recipeUrl"
            label="Recipe URL"
            id="recipeUrl"
            value={recipeUrl}
            onChange={(e) => {
              setRecipeUrl(e.target.value);
              setDuplicate(null);
              setFetchError(null);
            }}
            placeholder="https://example.com/recipe"
            hasError={!!duplicate}
            aria-invalid={duplicate ? true : undefined}
            aria-describedby={duplicate ? 'duplicateRecipeAlert' : undefined}
          />
          {duplicate && (
            <DuplicateRecipeAlert
              recipe={duplicate}
              id="duplicateRecipeAlert"
            />
          )}
          {fetchError && (
            <Alert>
              <p>{fetchError}</p>
            </Alert>
          )}
          <Button
            variant="primary"
            onClick={fetchAndParseRecipe}
            disabled={!recipeUrl.trim() || isFetching || !!duplicate}
            className={styles.fetchButton}
          >
            {isFetching ? 'Fetching…' : 'Fetch Recipe'}
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
      <Alert>
        <p>
          Error parsing recipe. Please{' '}
          <button className={styles.manualButton} onClick={switchToManual}>
            enter manually
          </button>{' '}
          and/or tell Meghan to investigate.
        </p>
        <Button variant="secondary" size="small" onClick={goBack}>
          Back
        </Button>
      </Alert>
    );
  }

  return (
    <div className={styles.manualContainer}>
      <div className={styles.header}>
        <h2>{recipe ? 'Review Recipe' : 'Manual Form'}</h2>
        <Button variant="secondary" size="small" onClick={goBack}>
          Back
        </Button>
      </div>
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
