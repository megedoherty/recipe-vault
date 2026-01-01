import { Metadata } from 'next';

import { getRecipe } from '@/lib/supabase/recipes';

import UpdateRecipeForm from './components/UpdateRecipeForm/UpdateRecipeForm.component';

export default async function EditRecipePage({
  params,
}: PageProps<'/recipes/[id]/edit'>) {
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(Number(id));

  return {
    title: `Edit ${recipe?.name} | Recipe Vault`,
  };
}
