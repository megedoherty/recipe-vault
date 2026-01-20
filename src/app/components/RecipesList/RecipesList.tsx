import RecipeCard from '@/components/molecules/RecipeCard/RecipeCard';
import { PAGE_SIZE } from '@/constants';
import { getAllRecipes } from '@/lib/supabase/queries/recipes';

import Pagination from '../Pagination/Pagination';
import SortBar from '../SortBar/SortBar';
import { parseQueryParams } from './RecipeList.utils';
import styles from './RecipesList.module.css';

interface RecipesListProps {
  query: Record<string, string | string[] | undefined>;
}

export default async function RecipesList({ query }: RecipesListProps) {
  const {
    includeAllUsers,
    name,
    categoryId,
    includeIngredients,
    excludeIngredients,
    equipment,
    minServings,
    maxServings,
    made,
    minRating,
    mealTypeId,
    occasionId,
    sort,
    page,
  } = parseQueryParams(query);

  const { recipes, count } = await getAllRecipes({
    name,
    categoryId,
    includeIngredients,
    excludeIngredients,
    equipment,
    minServings,
    maxServings,
    made,
    minRating,
    mealTypeId,
    occasionId,
    includeAllUsers,
    sort,
    page,
  });

  if (recipes.length === 0) {
    return <p>No recipes found</p>;
  }

  const pages = Math.ceil(count / PAGE_SIZE);

  return (
    <>
      <SortBar page={page ?? 1} count={count} />
      <ul className={styles.recipeGrid}>
        {recipes.map((recipe, index) => (
          <li key={recipe.id} className={styles.listItem}>
            <RecipeCard recipe={recipe} priority={index < 5} />
          </li>
        ))}
      </ul>
      <Pagination currentPage={page ?? 1} totalPages={pages} />
    </>
  );
}
