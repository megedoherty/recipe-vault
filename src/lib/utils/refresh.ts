import { EditableRecipe, ParsedRecipe } from '@/types';

/**
 * Combines a re-imported recipe with the saved one so a refresh doesn't wipe
 * user-set data. The parser doesn't know about equipment, storage or occasion,
 * and only guesses category, meal type and notes, so those stay as saved
 * (the guesses only fill gaps). Name, instructions and servings come from the
 * re-import.
 */
export function mergeRefreshedRecipe(
  existing: EditableRecipe,
  parsed: ParsedRecipe,
): { recipe: EditableRecipe; imageOptions: string[] } {
  const { recipe: fresh, imageUrls } = parsed;

  const recipe: EditableRecipe = {
    ...existing,
    name: fresh.name,
    instructions: fresh.instructions,
    servings: fresh.servings ?? existing.servings,
    notes: existing.notes || fresh.notes,
    categoryId: existing.categoryId ?? fresh.categoryId,
    mealTypeId: existing.mealTypeId ?? fresh.mealTypeId,
  };

  const imageOptions = [existing.imageUrl, ...(imageUrls ?? [])].filter(
    (url, index, urls): url is string => !!url && urls.indexOf(url) === index,
  );

  return { recipe, imageOptions };
}
