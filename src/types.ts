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

// Recipe types
export type RecipeDb = Database['public']['Tables']['recipe']['Row'];
export type Recipe = Omit<
  KeysToCamelCase<RecipeDb>,
  'ingredients' | 'instructions' | 'updatedAt' | 'userId'
> & {
  instructions: string[];
};
export type RecipeCardInfo = Pick<
  Recipe,
  'id' | 'name' | 'imageUrl' | 'rating' | 'made'
>;

// Ingredient types
// The exact row that comes from the database
export type IngredientDb = Database['public']['Tables']['ingredient']['Row'];
// The type used in recipes on the FE - all the fields except the recipe_id
export type Ingredient = Omit<KeysToCamelCase<IngredientDb>, 'recipeId'>;
// The type used when inserting a new ingredient
export type IngredientInsert =
  Database['public']['Tables']['ingredient']['Insert'];
// The type used when editing an ingredient
export type EditableIngredient = Omit<Ingredient, 'position'>;
// The type used when ingredients are grouped on the FE
export type IngredientSections = {
  title: string | null;
  id: string;
  ingredients: EditableIngredient[];
};
