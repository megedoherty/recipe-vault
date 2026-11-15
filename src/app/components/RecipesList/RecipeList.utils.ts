import { isSortOption } from '@/constants';

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
  const bookmarked = query.bookmarked === 'true';
  const sort = isSortOption(query.sort) ? query.sort : 'last_updated';
  const page = typeof query.page === 'string' ? parseInt(query.page, 10) : 1;

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
    bookmarked,
    sort,
    page,
  };
};

type RecipeQuery = ReturnType<typeof parseQueryParams>;

/**
 * Bookmarked recipes lead the list only on the plain home view: no search,
 * no filters and the default sort. As soon as the user narrows or re-sorts the
 * results, order is purely what they asked for. Page is not a filter, so
 * pinning carries across pages.
 */
export const shouldPinBookmarked = (params: RecipeQuery): boolean => {
  const { sort, page, includeAllUsers, bookmarked, ...filters } = params;
  void page;
  // includeAllUsers and bookmarked default to false; every other filter is
  // undefined when unset (note made=false is a real "not made" filter)
  return (
    sort === 'last_updated' &&
    !includeAllUsers &&
    !bookmarked &&
    Object.values(filters).every((value) => value === undefined)
  );
};
