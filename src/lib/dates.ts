export function fmtDateShort(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function fmtMonthYear(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

const SCHOOL_YEAR_START_MONTH = 7; // August (0-indexed)

export function monthsElapsed(now: Date): number {
  const y = now.getMonth() >= SCHOOL_YEAR_START_MONTH ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(y, SCHOOL_YEAR_START_MONTH, 1);
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
  if (months < 1) months = 1;
  if (months > 11) months = 11;
  return months;
}

export function groupByMonth<T>(
  items: T[],
  getDate: (item: T) => string
): { month: string; items: T[] }[] {
  const groups: { month: string; items: T[] }[] = [];
  for (const item of items) {
    const m = fmtMonthYear(getDate(item));
    let g = groups.find((x) => x.month === m);
    if (!g) {
      g = { month: m, items: [] };
      groups.push(g);
    }
    g.items.push(item);
  }
  return groups;
}
