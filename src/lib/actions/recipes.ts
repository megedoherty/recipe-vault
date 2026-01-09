'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import {
  InstructionSection,
  RecipeIngredientDb,
  RecipeIngredientSectionsEditable,
} from '@/types';

import { Json } from '../supabase/types';

interface ActionsResponse {
  success: boolean;
  error?: string;
}

/**
 * Removes empty steps from instruction sections and removes sections
 * that have only empty steps.
 *
 * Also cast to Json type for convenience.
 */
const cleanInstructionSections = (
  instructionSections: InstructionSection[],
): Json => {
  return instructionSections
    .map((section) => ({
      ...section,
      steps: section.steps.filter((step) => step.text.trim() !== ''),
    }))
    .filter((section) => section.steps.length > 0) as unknown as Json;
};

/**
 * Removes deleted ingredient IDs from all steps in instruction sections.
 */
const removeDeletedIngredientIds = (
  instructionSections: InstructionSection[],
  deletedIngredientIds: string[],
): InstructionSection[] => {
  if (deletedIngredientIds.length === 0) {
    return instructionSections;
  }

  return instructionSections.map((section) => ({
    ...section,
    steps: section.steps.map((step) => ({
      ...step,
      ingredientIds: step.ingredientIds?.filter(
        (id) => !deletedIngredientIds.includes(id),
      ),
    })),
  }));
};

/**
 * Creates the ingredients insert object for the recipe based on the FE sections object.
 */
const createIngredientsInsert = (
  ingredientSections: RecipeIngredientSectionsEditable[],
  recipeId: string,
): RecipeIngredientDb[] => {
  return ingredientSections
    .flatMap((section) =>
      section.ingredients.map((ingredient, index) => ({
        id: ingredient.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        section: section.title,
        recipe_id: recipeId,
        ingredient_id: ingredient.ingredientId
          ? Number(ingredient.ingredientId)
          : null,
        position: index,
      })),
    )
    .filter((ingredient) => ingredient.name.trim() !== '');
};

/**
 * Add a new recipe to the database.
 *
 * Inserts the recipe info into the recipe table.
 * Inserts the ingredients into the ingredient table with the new recipe ID.
 */
export async function addRecipe(
  ingredientSections: RecipeIngredientSectionsEditable[],
  instructionSections: InstructionSection[],
  selectedEquipment: string[],
  prevState: ActionsResponse | null,
  formData: FormData,
): Promise<ActionsResponse> {
  const rawFormData = Object.fromEntries(formData);
  const recipeName = rawFormData.name as string;
  const category_id = Number(rawFormData.categoryId);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Extract section order
  const instructionSectionOrder = instructionSections.map(
    (section) => section.id,
  );
  const ingredientSectionOrder = ingredientSections.map((s) => s.title);

  const { data, error } = await supabase
    .from('recipe')
    .insert({
      user_id: user.id,
      name: recipeName,
      category_id,
      instructions: cleanInstructionSections(instructionSections),
      ingredient_section_order: ingredientSectionOrder,
      instruction_section_order: instructionSectionOrder,
    })
    .select('id')
    .single();

  if (error || !data || !data.id) {
    console.error(error);
    return {
      success: false,
      error: error?.message ?? 'Failed to create recipe',
    };
  }

  const ingredients: RecipeIngredientDb[] = createIngredientsInsert(
    ingredientSections,
    data.id,
  );

  const { error: ingredientError } = await supabase
    .from('recipe_ingredient')
    .insert(ingredients);

  if (ingredientError) {
    console.error(ingredientError);
    return {
      success: false,
      error: ingredientError?.message ?? 'Failed to create ingredients',
    };
  }

  // Insert the equipment into the equipment table
  const { error: equipmentError } = await supabase
    .from('recipe_equipment')
    .insert(
      selectedEquipment.map((equipmentId) => ({
        recipe_id: data.id,
        equipment_id: parseInt(equipmentId),
      })),
    );

  if (equipmentError) {
    console.error(equipmentError);
    return {
      success: false,
      error: equipmentError?.message ?? 'Failed to create equipment',
    };
  }

  redirect(`/recipes/${data.id}`);
}

/**
 * Update a recipe in the database.
 *
 * Updates the recipe info in the recipe table.
 * Updates/inserts the ingredients in the ingredient table with the new recipe ID.
 * Deletes any ingredients that are no longer in the FE sections object.
 */
export async function updateRecipe(
  recipeId: string,
  ingredientSections: RecipeIngredientSectionsEditable[],
  instructionSections: InstructionSection[],
  selectedEquipment: string[],
  prevState: ActionsResponse | null,
  formData: FormData,
): Promise<ActionsResponse> {
  const rawFormData = Object.fromEntries(formData);
  const name = rawFormData.name as string;
  const image_url = rawFormData.imageUrl as string;
  const source_url = rawFormData.sourceUrl as string;
  const category_id = Number(rawFormData.categoryId);

  // Extract section order
  const instructionSectionOrder = instructionSections.map(
    (section) => section.id,
  );
  const ingredientSectionOrder = ingredientSections
    .map((s) => s.title)
    .filter((title) => title !== null);

  const supabase = await createClient();

  // Check if we need to delete any ingredients BEFORE updating the recipe
  // so we can remove their IDs from instruction steps
  const { data: currentIngredientIds } = await supabase
    .from('recipe_ingredient')
    .select('id')
    .eq('recipe_id', recipeId);

  const ingredients: RecipeIngredientDb[] = createIngredientsInsert(
    ingredientSections,
    recipeId,
  );

  // Identify ingredients to delete
  const ingredientsToDelete = currentIngredientIds
    ? currentIngredientIds.filter(
        (ingredient) => !ingredients.some((i) => i.id === ingredient.id),
      )
    : [];

  // Remove deleted ingredient IDs from all instruction steps
  const cleanedInstructionSections =
    ingredientsToDelete.length > 0
      ? removeDeletedIngredientIds(
          instructionSections,
          ingredientsToDelete.map((i) => i.id),
        )
      : instructionSections;

  // Update recipe with cleaned instruction sections
  const { data: recipeData, error } = await supabase
    .from('recipe')
    .update({
      name,
      instructions: cleanInstructionSections(cleanedInstructionSections),
      image_url,
      source_url,
      category_id,
      ingredient_section_order: ingredientSectionOrder,
      instruction_section_order: instructionSectionOrder,
    })
    .eq('id', recipeId)
    .select()
    .single();

  if (error || !recipeData) {
    console.error(error);
    return { success: false, error: error.message };
  }

  // Delete ingredients from database
  if (ingredientsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('recipe_ingredient')
      .delete()
      .in(
        'id',
        ingredientsToDelete.map((i) => i.id),
      );

    if (deleteError) {
      console.error(deleteError);
      return { success: false, error: deleteError.message };
    }
  }

  // Update the rest of the ingredients
  const { error: ingredientError } = await supabase
    .from('recipe_ingredient')
    .upsert(ingredients);

  if (ingredientError) {
    console.error(ingredientError);
    return {
      success: false,
      error: ingredientError?.message ?? 'Failed to update ingredients',
    };
  }

  // Update the equipment - delete all existing equipment and insert the new ones
  const { error: deleteEquipmentError } = await supabase
    .from('recipe_equipment')
    .delete()
    .eq('recipe_id', recipeId);

  if (deleteEquipmentError) {
    console.error(deleteEquipmentError);
    return {
      success: false,
      error: deleteEquipmentError.message ?? 'Failed to delete equipment',
    };
  }

  // Insert the selected equipment (only if there are any)
  if (selectedEquipment.length > 0) {
    const { error: equipmentError } = await supabase
      .from('recipe_equipment')
      .insert(
        selectedEquipment.map((equipmentId) => ({
          recipe_id: recipeId,
          equipment_id: parseInt(equipmentId, 10),
        })),
      );

    if (equipmentError) {
      console.error(equipmentError);
      return {
        success: false,
        error: equipmentError.message ?? 'Failed to update equipment',
      };
    }
  }

  redirect(`/recipes/${recipeData.id}`);
}

/**
 * Mark a recipe as made or not made.
 */
export async function toggleRecipeMade(
  recipeId: string,
  made: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe')
    .update({ made: made })
    .eq('id', recipeId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to toggle recipe made');
  }
}

/**
 * Update the rating of a recipe.
 */
export async function updateRecipeRating(
  recipeId: string,
  rating: number,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('recipe')
    .update({ rating: rating })
    .eq('id', recipeId);

  if (error) {
    throw new Error(error?.message ?? 'Failed to update recipe rating');
  }
}

/**
 * Delete a recipe from the database.
 */
export async function deleteRecipe(recipeId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('recipe').delete().eq('id', recipeId);

  if (error) {
    throw new Error(error?.message ?? 'Failed to delete recipe');
  }

  redirect('/');
}
