import { FormEvent } from 'react';

import {
  generateQueryString,
  getNumberSearchParam,
  getStringArraySearchParam,
  getStringSearchParam,
} from './utils';

describe('search param getters', () => {
  const params = new URLSearchParams('name=pasta&ids=1,2,3&count=12&empty=');

  it('getStringSearchParam returns the value or an empty string', () => {
    expect(getStringSearchParam(params, 'name')).toBe('pasta');
    expect(getStringSearchParam(params, 'missing')).toBe('');
  });

  it('getStringArraySearchParam splits on commas', () => {
    expect(getStringArraySearchParam(params, 'ids')).toEqual(['1', '2', '3']);
  });

  it('getStringArraySearchParam returns an empty array for missing or empty values', () => {
    expect(getStringArraySearchParam(params, 'missing')).toEqual([]);
    expect(getStringArraySearchParam(params, 'empty')).toEqual([]);
  });

  it('getNumberSearchParam parses integers', () => {
    expect(getNumberSearchParam(params, 'count')).toBe(12);
  });

  it('getNumberSearchParam returns null for missing or empty values', () => {
    expect(getNumberSearchParam(params, 'missing')).toBeNull();
    expect(getNumberSearchParam(params, 'empty')).toBeNull();
  });
});

describe('generateQueryString', () => {
  const buildEvent = (fields: Record<string, string>) => {
    const form = document.createElement('form');
    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    const preventDefault = jest.fn();
    const event = {
      preventDefault,
      currentTarget: form,
    } as unknown as FormEvent<HTMLFormElement>;

    return { event, preventDefault };
  };

  it('prevents the default form submission', () => {
    const { event, preventDefault } = buildEvent({});
    generateQueryString(event);

    expect(preventDefault).toHaveBeenCalled();
  });

  it('returns an empty string when nothing is filled in', () => {
    const { event } = buildEvent({ name: '', categoryId: '' });

    expect(generateQueryString(event)).toBe('');
  });

  it('trims the name and skips whitespace-only names', () => {
    expect(generateQueryString(buildEvent({ name: '  pasta  ' }).event)).toBe(
      'name=pasta',
    );

    expect(generateQueryString(buildEvent({ name: '   ' }).event)).toBe('');
  });

  it('passes through simple string fields', () => {
    const { event } = buildEvent({
      categoryId: '2',
      includeIngredients: 'a,b',
      excludeIngredients: 'c',
      equipment: 'x,y',
      mealTypeId: '3',
      occasionId: '4',
    });
    const params = new URLSearchParams(generateQueryString(event));

    expect(params.get('categoryId')).toBe('2');
    expect(params.get('includeIngredients')).toBe('a,b');
    expect(params.get('excludeIngredients')).toBe('c');
    expect(params.get('equipment')).toBe('x,y');
    expect(params.get('mealTypeId')).toBe('3');
    expect(params.get('occasionId')).toBe('4');
  });

  it('includes servings when min is less than or equal to max', () => {
    const params = new URLSearchParams(
      generateQueryString(
        buildEvent({ minServings: '2', maxServings: '4' }).event,
      ),
    );

    expect(params.get('minServings')).toBe('2');
    expect(params.get('maxServings')).toBe('4');
  });

  it('includes a single servings bound on its own', () => {
    expect(generateQueryString(buildEvent({ minServings: '2' }).event)).toBe(
      'minServings=2',
    );
    expect(generateQueryString(buildEvent({ maxServings: '6' }).event)).toBe(
      'maxServings=6',
    );
  });

  it('ignores both servings values when min is greater than max', () => {
    const { event } = buildEvent({ minServings: '8', maxServings: '2' });
    expect(generateQueryString(event)).toBe('');
  });

  it('ignores servings values that are not numbers', () => {
    const { event } = buildEvent({ minServings: 'abc', maxServings: '4' });
    expect(generateQueryString(event)).toBe('');
  });

  it('maps made yes/no to true/false and ignores other values', () => {
    expect(generateQueryString(buildEvent({ made: 'yes' }).event)).toBe(
      'made=true',
    );
    expect(generateQueryString(buildEvent({ made: 'no' }).event)).toBe(
      'made=false',
    );
    expect(generateQueryString(buildEvent({ made: 'all' }).event)).toBe('');
  });

  it('maps rating to minRating', () => {
    expect(generateQueryString(buildEvent({ rating: '4' }).event)).toBe(
      'minRating=4',
    );
  });

  it('includes checkbox params only when they are "true"', () => {
    expect(
      generateQueryString(
        buildEvent({ includeAllUsers: 'true', bookmarked: 'true' }).event,
      ),
    ).toBe('includeAllUsers=true&bookmarked=true');
    expect(
      generateQueryString(
        buildEvent({ includeAllUsers: 'false', bookmarked: 'false' }).event,
      ),
    ).toBe('');
  });
});
