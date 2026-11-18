import { getMealType } from './getMealType';

describe('getMealType', () => {
  it.each([
    'Brownies & Bars',
    'Candy',
    'Cakes',
    'Cookies',
    'Cupcakes',
    'Pastry',
    'Pies & Tarts',
  ])('treats the %s category as Dessert', (category) => {
    expect(getMealType('Anything', category)).toBe('Dessert');
  });

  it('prefers the category over keywords in the name', () => {
    expect(getMealType('Muffin Cake', 'Cakes')).toBe('Dessert');
  });

  it.each(['Blueberry Muffins', 'Flaky BISCUITS'])(
    'detects breakfast from the name: %s',
    (name) => {
      expect(getMealType(name, 'Bread')).toBe('Breakfast');
    },
  );

  it('returns null when nothing matches', () => {
    expect(getMealType('Sourdough Loaf', 'Bread')).toBeNull();
    expect(getMealType('Sourdough Loaf', '')).toBeNull();
  });
});
