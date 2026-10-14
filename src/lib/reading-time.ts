/** Minutes to read: fenced code removed, whitespace-separated words / 200, at least 1. */
export function readingTime(markdown: string | undefined): number {
  if (!markdown) return 1;
  const withoutCode = markdown.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, ' ');
  const words = withoutCode.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
