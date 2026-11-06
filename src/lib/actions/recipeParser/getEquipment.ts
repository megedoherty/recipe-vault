import { Equipment, InstructionSection } from '@/types';

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Find the equipment whose name appears in the instruction text.
// Matches whole words and allows a simple plural ("baking sheet(s)").
export const getEquipmentIds = (
  equipment: Equipment[],
  instructions: InstructionSection[],
): string[] => {
  const text = instructions
    .flatMap((section) => section.steps.map((step) => step.text))
    .join('\n')
    .toLowerCase();

  if (!text) return [];

  return equipment
    .filter(({ name }) => {
      const trimmed = name.trim().toLowerCase();
      if (!trimmed) return false;
      const pattern = new RegExp(
        `(?<![a-z])${escapeRegex(trimmed)}(?:e?s)?(?![a-z])`,
      );
      return pattern.test(text);
    })
    .map(({ id }) => id);
};
