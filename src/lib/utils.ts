export function parseTextareaToArray(text: string | undefined): string[] {
  if (!text) return [];

  return text.split(/\r?\n/).filter(Boolean);
}
