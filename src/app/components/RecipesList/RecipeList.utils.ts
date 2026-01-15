export const parseQueryParams = (
  query: Record<string, string | string[] | undefined>,
) => {
  const includeAllUsers = query.includeAllUsers === 'true';
  const name = typeof query.name === 'string' ? query.name : undefined;
  const categoryId =
    typeof query.categoryId === 'string'
      ? parseInt(query.categoryId, 10)
      : undefined;
  const includeIngredients =
    typeof query.includeIngredients === 'string'
      ? query.includeIngredients
      : undefined;
  const excludeIngredients =
    typeof query.excludeIngredients === 'string'
      ? query.excludeIngredients
      : undefined;
  const equipment =
    typeof query.equipment === 'string' ? query.equipment : undefined;
  const minServings =
    typeof query.minServings === 'string'
      ? parseInt(query.minServings, 10)
      : undefined;
  const maxServings =
    typeof query.maxServings === 'string'
      ? parseInt(query.maxServings, 10)
      : undefined;
  const made =
    typeof query.made === 'string' ? query.made === 'true' : undefined;
  const minRating =
    typeof query.minRating === 'string'
      ? parseInt(query.minRating, 10)
      : undefined;
  const mealTypeId =
    typeof query.mealTypeId === 'string'
      ? parseInt(query.mealTypeId, 10)
      : undefined;
  const occasionId =
    typeof query.occasionId === 'string'
      ? parseInt(query.occasionId, 10)
      : undefined;

  return {
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
  };
};
