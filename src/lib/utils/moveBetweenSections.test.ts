import { DropResult } from '@hello-pangea/dnd';

import moveBetweenSections from './moveBetweenSections';

interface Section {
  id: string;
  items: string[];
}

const sections: Section[] = [
  { id: 'a', items: ['a1', 'a2', 'a3'] },
  { id: 'b', items: ['b1'] },
  { id: 'c', items: [] },
];

const run = (
  sourceId: string,
  sourceIndex: number,
  destId?: string,
  destIndex = 0,
) =>
  moveBetweenSections(
    sections,
    {
      source: { droppableId: sourceId, index: sourceIndex },
      destination: destId ? { droppableId: destId, index: destIndex } : null,
    } as DropResult,
    (s) => s.items,
    (s, items) => ({ ...s, items }),
  );

describe('moveBetweenSections', () => {
  it('reorders within a section', () => {
    expect(run('a', 0, 'a', 2)[0].items).toEqual(['a2', 'a3', 'a1']);
  });

  it('moves an item to another section at the given index', () => {
    const result = run('a', 1, 'b', 0);
    expect(result[0].items).toEqual(['a1', 'a3']);
    expect(result[1].items).toEqual(['a2', 'b1']);
  });

  it('moves an item into an empty section', () => {
    const result = run('b', 0, 'c', 0);
    expect(result[1].items).toEqual([]);
    expect(result[2].items).toEqual(['b1']);
  });

  it('returns the same sections when dropped outside or in place', () => {
    expect(run('a', 0)).toBe(sections);
    expect(run('a', 1, 'a', 1)).toBe(sections);
  });
});
