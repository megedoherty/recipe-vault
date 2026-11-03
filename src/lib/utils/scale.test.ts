import { getLeadingAmount, getMeasurements, scaleQuantity } from './scale';

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

describe('getLeadingAmount', () => {
  it('reads the amount and unit', () => {
    expect(getLeadingAmount('8 oz')).toEqual({ amount: 8, unit: 'oz' });
    expect(getLeadingAmount('1 1/2 cups (190 g)')).toEqual({
      amount: 1.5,
      unit: 'cups',
    });
    expect(getLeadingAmount('½ cup')).toEqual({ amount: 0.5, unit: 'cup' });
    expect(getLeadingAmount('3')).toEqual({ amount: 3, unit: '' });
    expect(getLeadingAmount('2 (14 oz)')).toEqual({ amount: 2, unit: '' });
  });

  it('returns null when there is no single amount', () => {
    expect(getLeadingAmount(null)).toBeNull();
    expect(getLeadingAmount('pinch')).toBeNull();
    expect(getLeadingAmount('1-2 cups')).toBeNull();
    expect(getLeadingAmount('1 to 2 cups')).toBeNull();
  });
});

describe('getMeasurements', () => {
  it('returns the main amount and each parenthetical amount', () => {
    expect(getMeasurements('3 tablespoons (15 g)')).toEqual([
      { amount: 3, unit: 'tablespoons' },
      { amount: 15, unit: 'g' },
    ]);
  });

  it('ignores package sizes and non-exact amounts', () => {
    expect(getMeasurements('1 (14 oz) can')).toEqual([{ amount: 1, unit: '' }]);
    expect(getMeasurements('1-2 cups (120 g)')).toEqual([
      { amount: 120, unit: 'g' },
    ]);
    expect(getMeasurements(null)).toEqual([]);
  });
});
