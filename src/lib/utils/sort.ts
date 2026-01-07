/**
 * Creates a sort comparator that orders items based on a stored order array.
 * Items not in the order array are placed at the end, maintaining their relative order.
 */
export function sortByOrder<T>(
  order: string[],
  getKey: (item: T) => string | null,
): (a: T, b: T) => number {
  return (a, b) => {
    const indexA = order.indexOf(getKey(a) ?? '');
    const indexB = order.indexOf(getKey(b) ?? '');
    // Items not in the order array go to the end, maintaining their relative order
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  };
}
