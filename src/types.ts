import { Database } from '@/lib/supabase/types';

// Utils
// Convert a single key from snake_case to camelCase
type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

// Convert all keys in an object from snake_case to camelCase
export type KeysToCamelCase<T> = {
  [K in keyof T as SnakeToCamelCase<string & K>]: T[K];
};

// Instruction Section
export interface InstructionSection {
  id: string;
  title: string | null;
  steps: Step[];
}

export interface Step {
  text: string;
  id: string;
  ingredientIds?: string[];
}

// Recipe types
export type RecipeDb = Database['public']['Tables']['recipe']['Row'];
export type RecipeDisplayDb = Pick<
  RecipeDb,
  'name' | 'image_url' | 'source_url' | 'rating' | 'made' | 'instructions'
> & {
  category: { name: string } | null;
};
export type RecipeDisplay = Omit<
  KeysToCamelCase<RecipeDisplayDb>,
  'instructions' | 'category'
> & {
  instructions: InstructionSection[];
  category: string | null;
};
export type RecipeSummary = Pick<
  KeysToCamelCase<RecipeDb>,
  'id' | 'name' | 'imageUrl' | 'rating' | 'made'
>;

export type EditableRecipeDb = Pick<
  RecipeDb,
  'name' | 'image_url' | 'source_url' | 'instructions' | 'category_id'
>;
export type EditableRecipe = Omit<
  KeysToCamelCase<EditableRecipeDb>,
  'instructions'
> & {
  instructions: InstructionSection[];
};

// Ingredient types
// The exact row that comes from the database
export type IngredientDb = Database['public']['Tables']['ingredient']['Row'];
// What's returned from the query
export type IngredientDisplayDb = Pick<
  IngredientDb,
  'id' | 'name' | 'quantity' | 'position' | 'section'
>;
// What is available after processing
export type IngredientDisplay = Pick<
  IngredientDisplayDb,
  'id' | 'name' | 'quantity'
>;

// The type used when editing an ingredient
// What's returned from the query
export type EditableIngredientDb = Pick<
  IngredientDb,
  'id' | 'name' | 'quantity' | 'position' | 'section' | 'ingredient_id'
>;
export type EditableIngredient = KeysToCamelCase<
  Pick<
    EditableIngredientDb,
    'id' | 'name' | 'quantity' | 'section' | 'ingredient_id'
  >
>;

// The type used when ingredients are grouped on the FE. Id is used for the key in the UI.
type IngredientSectionBase<T> = {
  title: string | null;
  id: string;
  ingredients: T[];
};
export type IngredientSections = IngredientSectionBase<IngredientDisplay>;
export type IngredientSectionsEditable =
  IngredientSectionBase<EditableIngredient>;

// Category types
export type Category = Database['public']['Tables']['category']['Row'];

// Ingredient Catalog types
export type IngredientCatalogDb =
  Database['public']['Tables']['ingredient_catalog']['Row'];
export type IngredientCatalog = KeysToCamelCase<IngredientCatalogDb>;
