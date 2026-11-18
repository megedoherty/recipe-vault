import { getCategoryId } from './getCategory';

const categories = [
  { id: 1, name: 'Cakes' },
  { id: 2, name: 'Cupcakes' },
  { id: 3, name: 'Brownies & Bars' },
  { id: 4, name: 'Candy' },
  { id: 5, name: 'Bread' },
  { id: 6, name: 'Pies & Tarts' },
];

describe('getCategoryId', () => {
  it('matches a category name, ignoring case and plurals', () => {
    expect(getCategoryId(categories, 'Chocolate LAYER CAKE')).toBe(1);
    expect(getCategoryId(categories, 'Chewy cakes')).toBe(1);
  });

  it('matches any side of a combined "A & B" category', () => {
    expect(getCategoryId(categories, 'Fudgy Brownie Bites')).toBe(3);
    expect(getCategoryId(categories, 'Lemon Bars')).toBe(3);
    expect(getCategoryId(categories, 'Apple Tart')).toBe(6);
  });

  it('uses aliases before the generic name match', () => {
    // "cupcake" would otherwise be claimed by Cakes
    expect(getCategoryId(categories, 'Vanilla Cupcake')).toBe(2);
    expect(getCategoryId(categories, 'Peanut Butter Fudge')).toBe(4);
    expect(getCategoryId(categories, 'Dinner Rolls')).toBe(5);
    expect(getCategoryId(categories, 'Rice Krispie Treats')).toBe(3);
  });

  it('returns null when the alias category does not exist', () => {
    expect(getCategoryId([{ id: 1, name: 'Cakes' }], 'Fudge')).toBeNull();
  });

  it('returns null when nothing matches', () => {
    expect(getCategoryId(categories, 'Beef Stew')).toBeNull();
    expect(getCategoryId([], 'Chocolate Cake')).toBeNull();
  });
});
