import Link from 'next/link';

import Alert from '@/components/atoms/Alert/Alert';

interface DuplicateRecipeAlertProps {
  recipe: { id: string; name: string };
  id?: string;
}

/**
 * Tells the user they already have a recipe from the URL, linking to it.
 */
export default function DuplicateRecipeAlert({
  recipe,
  id,
}: DuplicateRecipeAlertProps) {
  return (
    <Alert id={id}>
      <p>
        You already imported{' '}
        <Link href={`/recipes/${recipe.id}`}>{recipe.name}</Link>.
      </p>
    </Alert>
  );
}
