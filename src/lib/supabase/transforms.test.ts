import {
  EditableRecipeDb,
  RecipeDisplayDb,
  RecipeEditableIngredientDb,
  RecipeIngredientDisplayDb,
  ShoppingListItemDb,
} from '@/types';

import {
  transformIngredientsForDisplay,
  transformIngredientsForEdit,
  transformRecipe,
  transformRecipeForEdit,
  transformShoppingListItems,
} from './transforms';

const makeStep = (id: string, text = id) => ({ id, text });
const makeInstructionSection = (id: string, steps = [makeStep(`${id}-1`)]) => ({
  id,
  title: id,
  steps,
});

function makeRecipeDb(
  overrides: Partial<RecipeDisplayDb> = {},
): RecipeDisplayDb {
  return {
    user_id: 'u1',
    name: 'Cake',
    made: true,
    bookmarked: false,
    image_url: 'img',
    source_url: 'src',
    instructions: [],
    instruction_section_order: null,
    category: { name: 'Dessert' },
    rating: 4,
    recipe_equipment: [],
    servings: 8,
    storage: [],
    notes: 'n',
    meal_type: { name: 'Dinner' },
    occasion: { name: 'Birthday' },
    ...overrides,
  };
}

describe('transformRecipe', () => {
  it('maps db fields to camelCase', () => {
    expect(transformRecipe(makeRecipeDb())).toEqual({
      userId: 'u1',
      name: 'Cake',
      made: true,
      bookmarked: false,
      imageUrl: 'img',
      sourceUrl: 'src',
      instructions: [],
      category: 'Dessert',
      rating: 4,
      equipment: [],
      servings: 8,
      storage: [],
      notes: 'n',
      mealType: 'Dinner',
      occasion: 'Birthday',
    });
  });

  it('nulls missing relations', () => {
    const result = transformRecipe(
      makeRecipeDb({ category: null, meal_type: null, occasion: null }),
    );
    expect(result.category).toBeNull();
    expect(result.mealType).toBeNull();
    expect(result.occasion).toBeNull();
  });

  it('sorts equipment names alphabetically', () => {
    const result = transformRecipe(
      makeRecipeDb({
        recipe_equipment: [
          { equipment: { name: 'Whisk' } },
          { equipment: { name: 'Bowl' } },
        ],
      }),
    );
    expect(result.equipment).toEqual(['Bowl', 'Whisk']);
  });

  describe('instructions', () => {
    it('keeps valid sections in stored order when no order is set', () => {
      const sections = [
        makeInstructionSection('b'),
        makeInstructionSection('a'),
      ];
      expect(
        transformRecipe(makeRecipeDb({ instructions: sections })).instructions,
      ).toEqual(sections);
    });

    it('reorders by instruction_section_order, unknown ids last', () => {
      const result = transformRecipe(
        makeRecipeDb({
          instructions: [
            makeInstructionSection('a'),
            makeInstructionSection('x'),
            makeInstructionSection('c'),
            makeInstructionSection('b'),
          ],
          instruction_section_order: ['b', 'c', 'a'],
        }),
      );
      expect(result.instructions.map((s) => s.id)).toEqual([
        'b',
        'c',
        'a',
        'x',
      ]);
    });

    it('ignores an invalid order array', () => {
      const result = transformRecipe(
        makeRecipeDb({
          instructions: [
            makeInstructionSection('a'),
            makeInstructionSection('b'),
          ],
          instruction_section_order: ['b', 1],
        }),
      );
      expect(result.instructions.map((s) => s.id)).toEqual(['a', 'b']);
    });

    it.each([
      ['not an array', 'nope'],
      ['null', null],
      ['section missing title', [{ id: 'a', steps: [] }]],
      ['section missing id', [{ title: 'a', steps: [] }]],
      ['section steps not an array', [{ id: 'a', title: 'a', steps: 'x' }]],
      ['step missing text', [{ id: 'a', title: 'a', steps: [{ id: 's' }] }]],
      ['step missing id', [{ id: 'a', title: 'a', steps: [{ text: 't' }] }]],
      ['non-object item', ['a']],
      ['null item', [null]],
    ])('falls back to [] when instructions are invalid (%s)', (_, value) => {
      expect(
        transformRecipe(makeRecipeDb({ instructions: value })).instructions,
      ).toEqual([]);
    });

    it('accepts an empty instructions array', () => {
      expect(
        transformRecipe(makeRecipeDb({ instructions: [] })).instructions,
      ).toEqual([]);
    });
  });

  describe('storage', () => {
    it('sorts by known storage location order', () => {
      const result = transformRecipe(
        makeRecipeDb({
          storage: [
            { location: 'Fridge', days: 3 },
            { location: 'Room Temperature', days: 1 },
          ],
        }),
      );
      expect(result.storage.map((s) => s.location)).toEqual([
        'Room Temperature',
        'Fridge',
      ]);
    });

    it.each([
      ['unknown location', [{ location: 'Moon', days: 1 }]],
      ['missing days', [{ location: 'Fridge' }]],
      ['non-string location', [{ location: 5, days: 1 }]],
      ['not an array', {}],
      ['null', null],
    ])('falls back to [] for invalid storage (%s)', (_, value) => {
      expect(transformRecipe(makeRecipeDb({ storage: value })).storage).toEqual(
        [],
      );
    });
  });
});

describe('transformRecipeForEdit', () => {
  const makeEditableRecipeDb = (
    overrides: Partial<EditableRecipeDb> = {},
  ): EditableRecipeDb => ({
    user_id: 'u1',
    name: 'Cake',
    image_url: 'img',
    source_url: 'src',
    instructions: [],
    instruction_section_order: null,
    ingredient_section_order: null,
    category_id: 2,
    recipe_equipment: [{ equipment_id: 5 }, { equipment_id: 7 }],
    servings: 8,
    storage: [],
    notes: 'n',
    meal_type_id: 3,
    occasion_id: 4,
    ...overrides,
  });

  it('maps fields and stringifies equipment ids', () => {
    const result = transformRecipeForEdit(makeEditableRecipeDb());
    expect(result).toMatchObject({
      userId: 'u1',
      name: 'Cake',
      imageUrl: 'img',
      sourceUrl: 'src',
      categoryId: 2,
      equipmentIds: ['5', '7'],
      servings: 8,
      notes: 'n',
      mealTypeId: 3,
      occasionId: 4,
    });
  });

  it('orders instruction sections by stored order', () => {
    const result = transformRecipeForEdit(
      makeEditableRecipeDb({
        instructions: [
          makeInstructionSection('a'),
          makeInstructionSection('b'),
        ],
        instruction_section_order: ['b', 'a'],
      }),
    );
    expect(result.instructions.map((s) => s.id)).toEqual(['b', 'a']);
  });

  it('falls back to [] for invalid instructions', () => {
    expect(
      transformRecipeForEdit(makeEditableRecipeDb({ instructions: 'bad' }))
        .instructions,
    ).toEqual([]);
  });

  it('fills in missing storage locations in the output', () => {
    const result = transformRecipeForEdit(
      makeEditableRecipeDb({ storage: [{ location: 'Fridge', days: 3 }] }),
    );
    expect(result.storage).toEqual([
      { location: 'Fridge', days: 3 },
      { location: 'Room Temperature', days: null },
    ]);
  });

  it('fills in every location when stored storage is invalid', () => {
    expect(
      transformRecipeForEdit(makeEditableRecipeDb({ storage: 'bad' })).storage,
    ).toEqual([
      { location: 'Room Temperature', days: null },
      { location: 'Fridge', days: null },
    ]);
  });
});

describe('transformIngredientsForDisplay', () => {
  const makeIngredientDisplayDb = (
    overrides: Partial<RecipeIngredientDisplayDb> = {},
  ): RecipeIngredientDisplayDb => ({
    id: 'i1',
    name: 'flour',
    quantity: '1 cup',
    section: 'Main',
    position: 0,
    ingredient_id: 10,
    ingredient: { name: 'All-purpose flour', category: 'Flours & Starches' },
    ...overrides,
  });

  it('maps an ingredient into a section', () => {
    const result = transformIngredientsForDisplay([makeIngredientDisplayDb()]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      title: 'Main',
      ingredients: [
        {
          id: 'i1',
          name: 'flour',
          quantity: '1 cup',
          normalizedIngredientId: 10,
          normalizedIngredientName: 'All-purpose flour',
          category: 'Flours & Starches',
        },
      ],
    });
    expect(typeof result[0].id).toBe('string');
  });

  it('defaults normalized fields when unlinked', () => {
    const [s] = transformIngredientsForDisplay([
      makeIngredientDisplayDb({ ingredient_id: null, ingredient: null }),
    ]);
    expect(s.ingredients[0]).toMatchObject({
      normalizedIngredientId: null,
      normalizedIngredientName: null,
      category: '',
    });
  });

  it('sorts by position and groups by section', () => {
    const result = transformIngredientsForDisplay([
      makeIngredientDisplayDb({ id: 'c', section: 'Glaze', position: 2 }),
      makeIngredientDisplayDb({ id: 'b', section: 'Main', position: 1 }),
      makeIngredientDisplayDb({ id: 'a', section: 'Main', position: 0 }),
    ]);
    expect(result.map((s) => s.title)).toEqual(['Main', 'Glaze']);
    expect(result[0].ingredients.map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('orders sections by sectionOrder', () => {
    const result = transformIngredientsForDisplay(
      [
        makeIngredientDisplayDb({ id: 'a', section: 'Main', position: 0 }),
        makeIngredientDisplayDb({ id: 'b', section: 'Glaze', position: 1 }),
        makeIngredientDisplayDb({ id: 'c', section: 'Other', position: 2 }),
      ],
      ['Glaze', 'Main'],
    );
    expect(result.map((s) => s.title)).toEqual(['Glaze', 'Main', 'Other']);
  });

  it.each([
    ['empty', []],
    ['invalid', [1, 2]],
    ['non-array', 'x'],
  ])('keeps position order when sectionOrder is %s', (_, order) => {
    const result = transformIngredientsForDisplay(
      [
        makeIngredientDisplayDb({ id: 'a', section: 'Main', position: 0 }),
        makeIngredientDisplayDb({ id: 'b', section: 'Glaze', position: 1 }),
      ],
      order,
    );
    expect(result.map((s) => s.title)).toEqual(['Main', 'Glaze']);
  });

  it('returns [] for no ingredients', () => {
    expect(transformIngredientsForDisplay([])).toEqual([]);
  });
});

describe('transformIngredientsForEdit', () => {
  const makeEditableIngredientDb = (
    overrides: Partial<RecipeEditableIngredientDb> = {},
  ): RecipeEditableIngredientDb => ({
    id: 'i1',
    name: 'flour',
    quantity: '1 cup',
    section: 'Main',
    position: 0,
    ingredient_id: 10,
    ...overrides,
  });

  it('stringifies ingredient_id and keeps section', () => {
    const [s] = transformIngredientsForEdit([makeEditableIngredientDb()]);
    expect(s.title).toBe('Main');
    expect(s.ingredients[0]).toEqual({
      id: 'i1',
      name: 'flour',
      quantity: '1 cup',
      section: 'Main',
      ingredientId: '10',
    });
  });

  it('uses null for an unlinked ingredient', () => {
    const [s] = transformIngredientsForEdit([
      makeEditableIngredientDb({ ingredient_id: null }),
    ]);
    expect(s.ingredients[0].ingredientId).toBeNull();
  });

  it('stringifies ingredient_id of 0', () => {
    const [s] = transformIngredientsForEdit([
      makeEditableIngredientDb({ ingredient_id: 0 }),
    ]);
    expect(s.ingredients[0].ingredientId).toBe('0');
  });

  it('sorts by position, groups by section, and applies sectionOrder', () => {
    const result = transformIngredientsForEdit(
      [
        makeEditableIngredientDb({ id: 'c', section: 'Glaze', position: 2 }),
        makeEditableIngredientDb({ id: 'b', section: 'Main', position: 1 }),
        makeEditableIngredientDb({ id: 'a', section: 'Main', position: 0 }),
      ],
      ['Glaze', 'Main'],
    );
    expect(result.map((s) => s.title)).toEqual(['Glaze', 'Main']);
    expect(result[1].ingredients.map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('ignores an invalid sectionOrder', () => {
    const result = transformIngredientsForEdit(
      [
        makeEditableIngredientDb({ id: 'a', section: 'Main', position: 0 }),
        makeEditableIngredientDb({ id: 'b', section: 'Glaze', position: 1 }),
      ],
      [1],
    );
    expect(result.map((s) => s.title)).toEqual(['Main', 'Glaze']);
  });
});

describe('transformShoppingListItems', () => {
  const makeShoppingListItemDb = (
    overrides: Partial<ShoppingListItemDb> = {},
  ): ShoppingListItemDb => ({
    id: 's1',
    recipe_id: 'r1',
    recipe_name: 'Cake',
    name: 'flour',
    quantity: '1 cup',
    normalized_ingredient_id: 10,
    ingredient: { name: 'All-purpose flour', category: 'Flours & Starches' },
    purchased: false,
    ...overrides,
  });

  it('maps items to camelCase', () => {
    expect(transformShoppingListItems([makeShoppingListItemDb()])).toEqual([
      {
        id: 's1',
        recipeId: 'r1',
        recipeName: 'Cake',
        name: 'flour',
        quantity: '1 cup',
        normalizedIngredientId: 10,
        normalizedIngredientName: 'All-purpose flour',
        category: 'Flours & Starches',
        purchased: false,
      },
    ]);
  });

  it('defaults category to Other and name to null without an ingredient', () => {
    const [result] = transformShoppingListItems([
      makeShoppingListItemDb({ ingredient: null }),
    ]);
    expect(result.category).toBe('Other');
    expect(result.normalizedIngredientName).toBeNull();
  });

  it('returns [] for no items', () => {
    expect(transformShoppingListItems([])).toEqual([]);
  });
});
