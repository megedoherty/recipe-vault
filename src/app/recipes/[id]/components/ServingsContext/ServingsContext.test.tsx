import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

import { ServingsProvider, useServings } from './ServingsContext';

const wrapper = (baseServings: number | null) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ServingsProvider baseServings={baseServings}>{children}</ServingsProvider>
  );
  return Wrapper;
};

describe('ServingsContext', () => {
  it('has safe defaults without a provider', () => {
    const { result } = renderHook(() => useServings());

    expect(result.current).toMatchObject({
      servings: 0,
      baseServings: 0,
      canScale: false,
      factor: 1,
      ingredients: [],
    });
    expect(() => result.current.setServings(3)).not.toThrow();
  });

  it('starts at the base servings with a factor of 1', () => {
    const { result } = renderHook(() => useServings(), {
      wrapper: wrapper(4),
    });

    expect(result.current).toMatchObject({
      servings: 4,
      baseServings: 4,
      canScale: true,
      factor: 1,
    });
  });

  it('updates the factor when servings change', () => {
    const { result } = renderHook(() => useServings(), {
      wrapper: wrapper(4),
    });

    act(() => result.current.setServings(6));

    expect(result.current.servings).toBe(6);
    expect(result.current.factor).toBe(1.5);
  });

  it.each([null, 0])('cannot scale when base servings is %s', (base) => {
    const { result } = renderHook(() => useServings(), {
      wrapper: wrapper(base),
    });

    expect(result.current.canScale).toBe(false);
    expect(result.current.baseServings).toBe(0);

    act(() => result.current.setServings(5));
    expect(result.current.factor).toBe(1);
  });

  it('exposes the ingredients it was given', () => {
    const ingredients = [{ id: '1', name: 'flour', quantity: '2 cups' }];
    const { result } = renderHook(() => useServings(), {
      wrapper: ({ children }) => (
        <ServingsProvider baseServings={2} ingredients={ingredients}>
          {children}
        </ServingsProvider>
      ),
    });

    expect(result.current.ingredients).toBe(ingredients);
  });
});
