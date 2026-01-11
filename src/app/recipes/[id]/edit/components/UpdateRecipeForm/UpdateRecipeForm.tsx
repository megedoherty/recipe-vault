import RecipeForm from '@/components/organisms/RecipeForm/RecipeForm';
import {
  Category,
  EditableRecipe,
  Equipment,
  IngredientForRecipeEdit,
  MealType,
  Occasion,
  RecipeIngredientSectionsEditable,
} from '@/types';

interface UpdateRecipeFormComponentProps {
  recipeId: string;
  recipe: EditableRecipe;
  ingredientSections: RecipeIngredientSectionsEditable[];
  categories: Category[];
  ingredients: IngredientForRecipeEdit[];
  equipment: Equipment[];
  mealTypes: MealType[];
  occasions: Occasion[];
}

export default function UpdateRecipeForm({
  recipeId,
  recipe,
  ingredientSections,
  categories,
  ingredients,
  equipment,
  mealTypes,
  occasions,
}: UpdateRecipeFormComponentProps) {
  return (
    <RecipeForm
      mode="update"
      recipeId={recipeId}
      initialRecipe={recipe}
      initialIngredientSections={ingredientSections}
      categories={categories}
      ingredients={ingredients}
      equipment={equipment}
      mealTypes={mealTypes}
      occasions={occasions}
    />
  );
}
