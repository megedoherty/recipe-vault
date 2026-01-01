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
  'ingredients' | 'instructions'
> & {
  ingredients: string[];
  instructions: string[];
};
export type RecipeCardInfo = Pick<
  Recipe,
  'id' | 'name' | 'imageUrl' | 'rating' | 'made'
>;
