import { SortOption } from '@/constants';
import {
  EditableRecipe,
  RecipeDisplay,
  RecipeIngredientSections,
  RecipeIngredientSectionsEditable,
  RecipeSummary,
  ServingsRange,
} from '@/types';

import { createClient } from '../server';
import {
  transformIngredientsForDisplay,
  transformIngredientsForEdit,
  transformRecipe,
  transformRecipeForEdit,
} from '../transforms';

export async function getRecipeForDisplay(
  id: string,
): Promise<RecipeDisplay | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('recipe')
    .select(
      'image_url, instructions, name, made, rating, source_url, category(name), instruction_section_order, recipe_equipment(equipment(name)), servings, storage, notes, meal_type(name), occasion(name)',
    )
    .eq('id', id)
    .single();

  return data ? transformRecipe(data) : null;
}

export async function getRecipeForEdit(
  id: string,
): Promise<EditableRecipe | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('recipe')
    .select(
      'name, image_url, source_url, instructions, category_id, ingredient_section_order, instruction_section_order, recipe_equipment(equipment_id), servings, storage, notes, meal_type_id, occasion_id',
    )
    .eq('id', id)
    .single();
  return data ? transformRecipeForEdit(data) : null;
}

export async function getRecipeIngredientsForDisplay(
  id: string,
): Promise<RecipeIngredientSections[]> {
  const supabase = await createClient();

  // Get ingredients
  const { data: ingredients } = await supabase
    .from('recipe_ingredient')
    .select('id, name, quantity, position, section')
    .eq('recipe_id', id);

  // Get section order from recipe
  const { data: recipe } = await supabase
    .from('recipe')
    .select('ingredient_section_order')
    .eq('id', id)
    .single();

  return ingredients
    ? transformIngredientsForDisplay(
        ingredients,
        recipe?.ingredient_section_order,
      )
    : [];
}

export async function getRecipeIngredientsForEdit(
  id: string,
): Promise<RecipeIngredientSectionsEditable[]> {
  const supabase = await createClient();

  // Get ingredients
  const { data: ingredients } = await supabase
    .from('recipe_ingredient')
    .select('id, name, quantity, position, section, ingredient_id')
    .eq('recipe_id', id);

  // Get section order from recipe
  const { data: recipe } = await supabase
    .from('recipe')
    .select('ingredient_section_order')
    .eq('id', id)
    .single();

  return ingredients
    ? transformIngredientsForEdit(ingredients, recipe?.ingredient_section_order)
    : [];
}

interface GetAllRecipesParams {
  name?: string;
  categoryId?: number;
  includeIngredients?: string;
  excludeIngredients?: string;
  equipment?: string;
  minServings?: number;
  maxServings?: number;
  made?: boolean;
  minRating?: number;
  mealTypeId?: number;
  occasionId?: number;
  includeAllUsers?: boolean;
  sort?: SortOption;
}

interface GetAllRecipesResult {
  recipes: RecipeSummary[];
  count: number;
}

const getAllRecipesEmptyResult: GetAllRecipesResult = {
  recipes: [],
  count: 0,
};

export async function getAllRecipes({
  name,
  categoryId,
  includeIngredients,
  excludeIngredients,
  equipment,
  minServings,
  maxServings,
  made,
  minRating,
  mealTypeId,
  occasionId,
  includeAllUsers = false,
  sort = 'last_updated',
}: GetAllRecipesParams = {}): Promise<GetAllRecipesResult> {
  const supabase = await createClient();
  let query = supabase
    .from('recipe')
    .select('id, name, image_url, rating, made', { count: 'exact' });

  switch (sort) {
    case 'last_updated':
      query = query.order('updated_at', { ascending: false });
      break;
    case 'name_asc':
      query = query.order('name', { ascending: true });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
  }

  // Filter by user_id by default unless includeAllUsers is true
  if (!includeAllUsers) {
    const { data: claimsData } = await supabase.auth.getClaims();
    if (claimsData?.claims?.sub) {
      query = query.eq('user_id', claimsData.claims.sub);
    }
  }

  if (name) {
    query = query.ilike('name', `%${name}%`);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (minServings) {
    query = query.gte('servings', minServings);
  }

  if (maxServings) {
    query = query.lte('servings', maxServings);
  }

  if (made !== undefined) {
    query = query.eq('made', made);
  }

  if (minRating) {
    query = query.gte('rating', minRating);
  }

  if (mealTypeId) {
    query = query.eq('meal_type_id', mealTypeId);
  }

  if (occasionId) {
    query = query.eq('occasion_id', occasionId);
  }

  // Collect all recipe ID filters
  let includedRecipeIds: string[] = [];
  let excludedRecipeIds: string[] = [];
  let equipmentRecipeIds: string[] = [];

  // Handle included ingredients (must have ALL)
  if (includeIngredients && includeIngredients.length > 0) {
    // Convert string IDs to numbers (ingredients uses number IDs)
    const ingredientIds = includeIngredients
      .split(',')
      .map((id) => parseInt(id, 10));

    // Get all ingredients that match the selected ingredients IDs
    const { data: ingredients } = await supabase
      .from('recipe_ingredient')
      .select('recipe_id, ingredient_id')
      .in('ingredient_id', ingredientIds)
      .not('recipe_id', 'is', null)
      .overrideTypes<Array<{ recipe_id: string; ingredient_id: number }>>();

    if (ingredients && ingredients.length > 0) {
      // Group by recipe_id and count unique ingredients per recipe in set
      const recipeToIngredients = ingredients.reduce(
        (acc, ing) => {
          if (!acc[ing.recipe_id]) {
            acc[ing.recipe_id] = new Set();
          }
          acc[ing.recipe_id].add(ing.ingredient_id);
          return acc;
        },
        {} as Record<string, Set<number>>,
      );

      // Filter to recipes that have ALL selected ingredients
      const recipeIds = Object.entries(recipeToIngredients)
        .filter(
          ([, ingredientSet]) => ingredientSet.size === ingredientIds.length,
        )
        .map(([recipeId]) => recipeId);

      if (recipeIds.length > 0) {
        includedRecipeIds = recipeIds;
      } else {
        // No recipes have all the ingredients, return empty
        return getAllRecipesEmptyResult;
      }
    } else {
      // No ingredients found, return empty
      return getAllRecipesEmptyResult;
    }
  }

  // Handle excluded ingredients (must not have ANY)
  if (excludeIngredients && excludeIngredients.length > 0) {
    const excludedIngredientIds = excludeIngredients
      .split(',')
      .map((id) => parseInt(id, 10));

    const { data: excludedRecipes } = await supabase
      .from('recipe_ingredient')
      .select('recipe_id')
      .in('ingredient_id', excludedIngredientIds)
      .not('recipe_id', 'is', null)
      .overrideTypes<Array<{ recipe_id: string }>>();

    if (excludedRecipes && excludedRecipes.length > 0) {
      excludedRecipeIds = [...new Set(excludedRecipes.map((r) => r.recipe_id))];
    }
  }

  // Handle equipment (must have ALL selected equipment)
  if (equipment && equipment.length > 0) {
    const equipmentIdNumbers = equipment
      .split(',')
      .map((id) => parseInt(id, 10));

    const { data: recipeEquipment } = await supabase
      .from('recipe_equipment')
      .select('recipe_id, equipment_id')
      .in('equipment_id', equipmentIdNumbers)
      .not('recipe_id', 'is', null);

    if (recipeEquipment && recipeEquipment.length > 0) {
      // Group by recipe_id and count unique equipment per recipe
      const recipeToEquipment = recipeEquipment.reduce(
        (acc, re) => {
          if (!acc[re.recipe_id]) {
            acc[re.recipe_id] = new Set();
          }
          acc[re.recipe_id].add(re.equipment_id);
          return acc;
        },
        {} as Record<string, Set<number>>,
      );

      // Filter to recipes that have ALL selected equipment
      const recipeIds = Object.entries(recipeToEquipment)
        .filter(
          ([, equipmentSet]) => equipmentSet.size === equipmentIdNumbers.length,
        )
        .map(([recipeId]) => recipeId);

      if (recipeIds.length > 0) {
        equipmentRecipeIds = recipeIds;
      } else {
        return getAllRecipesEmptyResult;
      }
    } else {
      return getAllRecipesEmptyResult;
    }
  }

  // Combine all filters: find intersection of all included filters, then remove excluded
  let finalRecipeIds: string[] | undefined;

  if (includedRecipeIds.length > 0 || equipmentRecipeIds.length > 0) {
    // Start with the first non-empty filter
    let combinedIds: string[] = [];

    if (includedRecipeIds.length > 0 && equipmentRecipeIds.length > 0) {
      // Find intersection: recipes that match BOTH ingredient AND equipment filters
      combinedIds = includedRecipeIds.filter((id) =>
        equipmentRecipeIds.includes(id),
      );
    } else if (includedRecipeIds.length > 0) {
      combinedIds = includedRecipeIds;
    } else if (equipmentRecipeIds.length > 0) {
      combinedIds = equipmentRecipeIds;
    }

    // Remove recipes with excluded ingredients
    finalRecipeIds = combinedIds.filter(
      (id) => !excludedRecipeIds.includes(id),
    );
  } else if (excludedRecipeIds.length > 0) {
    // Only excluded ingredients filter - use query filter
    finalRecipeIds = undefined;
    query = query.not('id', 'in', `(${excludedRecipeIds.join(',')})`);
  }

  if (finalRecipeIds !== undefined) {
    if (finalRecipeIds.length > 0) {
      query = query.in('id', finalRecipeIds);
    } else {
      // No recipes match after filtering, return empty
      return getAllRecipesEmptyResult;
    }
  }

  const { data, count } = await query;

  return data
    ? {
        recipes: data.map((recipe) => ({
          id: recipe.id,
          name: recipe.name,
          imageUrl: recipe.image_url,
          rating: recipe.rating,
          made: recipe.made,
        })),
        count: count ?? 0,
      }
    : getAllRecipesEmptyResult;
}

export async function getServingsRange(): Promise<ServingsRange> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('recipe')
    .select('servings')
    .not('servings', 'is', null);

  if (!data || data.length === 0) {
    return { min: 0, max: 0 };
  }

  const servings = data
    .map((r) => r.servings)
    .filter((s): s is number => s !== null);

  return {
    min: Math.min(...servings),
    max: Math.max(...servings),
  };
}
