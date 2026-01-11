import RecipeForm from '@/components/organisms/RecipeForm/RecipeForm';
import {
  Category,
  Equipment,
  IngredientForRecipeEdit,
  MealType,
  Occasion,
} from '@/types';

interface CreateRecipeFormComponentProps {
  categories: Category[];
  ingredients: IngredientForRecipeEdit[];
  equipment: Equipment[];
  mealTypes: MealType[];
  occasions: Occasion[];
}

export default function CreateRecipeForm({
  categories,
  ingredients,
  equipment,
  mealTypes,
  occasions,
}: CreateRecipeFormComponentProps) {
  return (
    <RecipeForm
      mode="create"
      categories={categories}
      ingredients={ingredients}
      equipment={equipment}
      mealTypes={mealTypes}
      occasions={occasions}
    />
  );
}
