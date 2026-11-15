import { parseQueryParams, shouldPinBookmarked } from './RecipeList.utils';

const pins = (query: Record<string, string | undefined>) =>
  shouldPinBookmarked(parseQueryParams(query));

describe('parseQueryParams bookmarked', () => {
  it('should be true only for bookmarked=true', () => {
    expect(parseQueryParams({ bookmarked: 'true' }).bookmarked).toBe(true);
    expect(parseQueryParams({ bookmarked: 'false' }).bookmarked).toBe(false);
    expect(parseQueryParams({}).bookmarked).toBe(false);
  });
});

describe('shouldPinBookmarked', () => {
  it('should pin on the plain home view', () => {
    expect(pins({})).toBe(true);
  });

  it('should keep pinning on later pages', () => {
    expect(pins({ page: '3' })).toBe(true);
  });

  it('should pin when the sort is explicitly the default', () => {
    expect(pins({ sort: 'last_updated' })).toBe(true);
  });

  it.each([
    ['name search', { name: 'soup' }],
    ['category', { categoryId: '2' }],
    ['meal type', { mealTypeId: '1' }],
    ['occasion', { occasionId: '1' }],
    ['include ingredients', { includeIngredients: '1,2' }],
    ['exclude ingredients', { excludeIngredients: '3' }],
    ['equipment', { equipment: '4' }],
    ['min servings', { minServings: '2' }],
    ['max servings', { maxServings: '6' }],
    ['made', { made: 'true' }],
    ['made (no)', { made: 'false' }],
    ['rating', { minRating: '4' }],
    ['all users', { includeAllUsers: 'true' }],
    ['bookmarked only', { bookmarked: 'true' }],
    ['non-default sort', { sort: 'name_asc' }],
  ])('should not pin with %s', (_label, query) => {
    expect(pins(query)).toBe(false);
  });
});
