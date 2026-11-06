import { getEquipmentIds } from './getEquipment';

const equipment = [
  { id: '1', name: 'Stand Mixer' },
  { id: '2', name: 'Baking Sheet' },
  { id: '3', name: 'Pot' },
  { id: '4', name: 'C++ Tool' },
];

const sections = (...texts: string[]) => [
  {
    id: 's',
    title: null,
    steps: texts.map((text, i) => ({ id: `${i}`, text })),
  },
];

describe('getEquipmentIds', () => {
  it('matches names case-insensitively, including plurals', () => {
    expect(
      getEquipmentIds(
        equipment,
        sections('Beat in a stand mixer.', 'Line two baking sheets.'),
      ),
    ).toEqual(['1', '2']);
  });

  it('only matches whole words', () => {
    expect(getEquipmentIds(equipment, sections('Add the potatoes.'))).toEqual(
      [],
    );
  });

  it('escapes regex characters in names', () => {
    expect(getEquipmentIds(equipment, sections('Use a c++ tool.'))).toEqual([
      '4',
    ]);
  });

  it('returns nothing without instructions', () => {
    expect(getEquipmentIds(equipment, [])).toEqual([]);
  });
});
