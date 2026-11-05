import { InstructionSection } from '@/types';

import unlinkMissingIngredients from './unlinkMissingIngredients';

const sections: InstructionSection[] = [
  {
    id: 's1',
    title: 'Dough',
    steps: [
      { id: 'a', text: 'Mix', ingredientIds: ['flour', 'milk'] },
      { id: 'b', text: 'Rest' },
      { id: 'c', text: 'Knead', ingredientIds: ['milk'] },
    ],
  },
  {
    id: 's2',
    title: null,
    steps: [{ id: 'd', text: 'Bake', ingredientIds: ['flour'] }],
  },
];

describe('unlinkMissingIngredients', () => {
  it('returns the same reference when every link is still valid', () => {
    const result = unlinkMissingIngredients(
      sections,
      new Set(['flour', 'milk']),
    );

    expect(result).toBe(sections);
  });

  it('removes links to ingredients that no longer exist, across all sections', () => {
    const result = unlinkMissingIngredients(sections, new Set(['flour']));

    expect(result[0].steps[0].ingredientIds).toEqual(['flour']);
    expect(result[0].steps[2].ingredientIds).toEqual([]);
    expect(result[1].steps[0].ingredientIds).toEqual(['flour']);
  });

  it('removes every link when no ingredients remain', () => {
    const result = unlinkMissingIngredients(sections, new Set());

    expect(
      result.flatMap((s) => s.steps).map((step) => step.ingredientIds ?? []),
    ).toEqual([[], [], [], []]);
  });

  it('leaves steps without links and untouched steps as they were', () => {
    const result = unlinkMissingIngredients(sections, new Set(['flour']));

    expect(result[0].steps[1]).toBe(sections[0].steps[1]);
    expect(result[1].steps[0]).toBe(sections[1].steps[0]);
  });

  it('does not mutate its input', () => {
    unlinkMissingIngredients(sections, new Set());

    expect(sections[0].steps[0].ingredientIds).toEqual(['flour', 'milk']);
  });
});
