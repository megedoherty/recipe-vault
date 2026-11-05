import { DropResult } from '@hello-pangea/dnd';

/**
 * Applies a drag result to a list of sections, moving an item within a section
 * or from one section to another. Each section's `droppableId` must equal its `id`.
 */
export default function moveBetweenSections<
  TSection extends { id: string },
  TItem,
>(
  sections: TSection[],
  result: DropResult,
  getItems: (section: TSection) => TItem[],
  withItems: (section: TSection, items: TItem[]) => TSection,
): TSection[] {
  const { source, destination } = result;
  if (!destination) return sections;
  if (
    source.droppableId === destination.droppableId &&
    source.index === destination.index
  ) {
    return sections;
  }

  const sourceSection = sections.find((s) => s.id === source.droppableId);
  const moved = sourceSection && getItems(sourceSection)[source.index];
  if (!moved) return sections;

  return sections.map((section) => {
    const isSource = section.id === source.droppableId;
    const isDestination = section.id === destination.droppableId;

    if (!isSource && !isDestination) return section;

    const items = [...getItems(section)];
    if (isSource) items.splice(source.index, 1);
    if (isDestination) items.splice(destination.index, 0, moved);

    return withItems(section, items);
  });
}
