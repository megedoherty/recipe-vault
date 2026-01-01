import UpdateRecipeForm from '@/components/UpdateRecipeForm/UpdateRecipeForm.component';
import { getRecipe } from '@/lib/supabase/recipes';

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;
  const recipe = await getRecipe(Number(id));

  if (recipe === null) {
    return <div>Recipe not found</div>;
  }

  return (
    <div>
      <h1>Edit Recipe</h1>
      <UpdateRecipeForm recipe={recipe} />
    </div>
  );
}
