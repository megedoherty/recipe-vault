import { scaleQuantity } from './scale';

describe('scaleQuantity', () => {
  it('returns null and unchanged quantities when there is nothing to scale', () => {
    expect(scaleQuantity(null, 2)).toBeNull();
    expect(scaleQuantity('1 cup', 1)).toBe('1 cup');
    expect(scaleQuantity('pinch', 3)).toBe('pinch');
  });

  it('scales whole numbers and pluralizes units', () => {
    expect(scaleQuantity('1 cup', 2)).toBe('2 cups');
    expect(scaleQuantity('2 cups', 0.5)).toBe('1 cup');
  });

  it('formats results as fractions', () => {
    expect(scaleQuantity('1 cup', 1.5)).toBe('1 ½ cups');
    expect(scaleQuantity('1/2 cup', 0.5)).toBe('¼ cup');
    expect(scaleQuantity('1 teaspoon', 1 / 3)).toBe('⅓ teaspoon');
  });

  it('scales mixed and unicode fractions', () => {
    expect(scaleQuantity('1 1/2 cups', 2)).toBe('3 cups');
    expect(scaleQuantity('1 ½ cups', 2)).toBe('3 cups');
    expect(scaleQuantity('1 and 1/2 cups', 2)).toBe('3 cups');
  });

  it('falls back to a rounded decimal', () => {
    expect(scaleQuantity('1 cup', 1.1)).toBe('1.1 cups');
  });

  it('scales both ends of a range', () => {
    expect(scaleQuantity('1-2 cups', 2)).toBe('2-4 cups');
  });

  it('scales each term of a plus expression', () => {
    expect(scaleQuantity('1 cup + 2 tablespoons', 2)).toBe(
      '2 cups + 4 tablespoons',
    );
    expect(scaleQuantity('3 sticks + 1 tablespoon', 2)).toBe(
      '6 sticks + 2 tablespoons',
    );
  });

  it('scales parenthetical equivalents and rounds grams', () => {
    expect(scaleQuantity('1 1/2 cups (190 g)', 2)).toBe('3 cups (380 g)');
    expect(scaleQuantity('1 cup (125 g)', 1.5)).toBe('1 ½ cups (188 g)');
  });

  it('does not scale package sizes in parentheses', () => {
    expect(scaleQuantity('2 (14 oz)', 2)).toBe('4 (14 oz)');
  });

  it('scales counts with size words', () => {
    expect(scaleQuantity('1 large', 1.5)).toBe('1 ½ large');
    expect(scaleQuantity('3', 2)).toBe('6');
  });
});
