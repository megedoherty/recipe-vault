import { Json, Tables } from '@/lib/supabase/types';

////////////////////////////////////////////////////////////
// FE unique types
////////////////////////////////////////////////////////////

// A section of instructions, stored in the database as a JSON array
export interface InstructionSection {
  id: string;
  title: string | null;
  steps: Step[];
}

// Single step in an instruction section
export interface Step {
  text: string;
  id: string;
  ingredientIds?: string[];
}

export interface StorageInfo {
  location: 'Room temperature' | 'Fridge' | 'Freezer';
  days: number | null;
}

// The type used when ingredients are grouped on the FE
type RecipeIngredientSectionBase<T> = {
  title: string | null;
  id: string; // UI only key
  ingredients: T[];
};

////////////////////////////////////////////////////////////
// Recipe types
////////////////////////////////////////////////////////////

// The type used when querying for a single recipe
export interface RecipeDisplayDb {
  name: string;
  image_url: string | null;
  source_url: string | null;
  rating: number | null;
  made: boolean;
  instructions: Json;
  instruction_section_order: Json;
  category: { name: string } | null;
  recipe_equipment: {
    equipment: {
      name: string;
    };
  }[];
  servings: number | null;
  storage: Json;
}

// The type used on the FE when displaying a single recipe
export interface RecipeDisplay {
  name: string;
  made: boolean;
  imageUrl: string | null;
  sourceUrl: string | null;
  instructions: InstructionSection[];
  rating: number | null;
  category: string | null;
  equipment: string[];
  servings: number | null;
  storage: StorageInfo[];
}

// The type used when displaying a list of recipes
export interface RecipeSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  rating: number | null;
  made: boolean;
}

// The type used when querying for a recipe to edit it
export interface EditableRecipeDb {
  name: string;
  image_url: string | null;
  source_url: string | null;
  instructions: Json;
  instruction_section_order: Json;
  category_id: number | null;
  ingredient_section_order: Json;
  recipe_equipment: {
    equipment_id: number;
  }[];
  servings: number | null;
}

// The type used on the FE when editing a recipe
export interface EditableRecipe {
  name: string;
  imageUrl: string | null;
  sourceUrl: string | null;
  instructions: InstructionSection[];
  categoryId: number | null;
  equipmentIds: string[];
  servings: number | null;
}

export interface ServingsRange {
  min: number;
  max: number;
}

////////////////////////////////////////////////////////////
// Recipe ingredient types
////////////////////////////////////////////////////////////

// The exact row that comes from the database
export type RecipeIngredientDb = Tables<'recipe_ingredient'>;

// The type used when querying for a single recipe's ingredients
export interface RecipeIngredientDisplayDb {
  id: string;
  name: string;
  quantity: string | null;
  position: number;
  section: string | null;
}

// The type used on the FE when displaying a single recipe's ingredients
export interface RecipeIngredientDisplay {
  id: string;
  name: string;
  quantity: string | null;
}
export type RecipeIngredientSections =
  RecipeIngredientSectionBase<RecipeIngredientDisplay>;

// The type used when querying for a single recipe's ingredients to edit it
export interface RecipeEditableIngredientDb {
  id: string;
  name: string;
  quantity: string | null;
  position: number;
  section: string | null;
  ingredient_id: number | null;
}

// The type used on the FE when editing a single recipe's ingredients
export interface RecipeEditableIngredient {
  id: string;
  name: string;
  quantity: string | null;
  section: string | null;
  ingredientId: string | null;
}
export type RecipeIngredientSectionsEditable =
  RecipeIngredientSectionBase<RecipeEditableIngredient>;

////////////////////////////////////////////////////////////
// Category types
////////////////////////////////////////////////////////////

export type Category = Tables<'category'>;

////////////////////////////////////////////////////////////
// Ingredient types
////////////////////////////////////////////////////////////

// The type used when querying for all the ingredients
export interface IngredientDb {
  id: string;
  name: string;
  category: string | null;
  parentId: string;
}

// The type used on the FE for all the ingredients to edit a recipe
export interface IngredientForRecipeEdit {
  id: string;
  name: string;
  category: string | null;
}

// The type used on the FE when searching for ingredients
export interface IngredientForSearch {
  id: string;
  name: string;
  category: string | null;
  childrenIds: string[];
  parentIds: string[];
  depth: number;
}

////////////////////////////////////////////////////////////
// Equipment types
////////////////////////////////////////////////////////////

export type EquipmentDb = Tables<'equipment'>;
export interface Equipment {
  id: string;
  name: string;
}
