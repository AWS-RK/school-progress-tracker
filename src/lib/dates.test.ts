import { describe, it, expect } from 'vitest';
import { fmtDateShort, fmtMonthYear, monthsElapsed, groupByMonth } from './dates';

describe('fmtDateShort', () => {
  it('formats an ISO date as "Mon D"', () => {
    expect(fmtDateShort('2026-08-03')).toBe('Aug 3');
  });
});

describe('fmtMonthYear', () => {
  it('formats an ISO date as "Month YYYY"', () => {
    expect(fmtMonthYear('2026-07-28')).toBe('July 2026');
  });
});

describe('monthsElapsed', () => {
  it('counts from August 1 as month 1', () => {
    expect(monthsElapsed(new Date(2026, 7, 1))).toBe(1);
  });
  it('counts October as month 3', () => {
    expect(monthsElapsed(new Date(2026, 9, 15))).toBe(3);
  });
  it('clamps to 11 in June of the following year', () => {
    expect(monthsElapsed(new Date(2027, 5, 15))).toBe(11);
  });
  it('rolls over to a new school year in July', () => {
    expect(monthsElapsed(new Date(2027, 6, 1))).toBe(11);
  });
});

describe('groupByMonth', () => {
  it('groups items by their formatted month, preserving order', () => {
    const items = [
      { date: '2026-08-03' },
      { date: '2026-07-28' },
      { date: '2026-07-15' },
    ];
    const groups = groupByMonth(items, (i) => i.date);
    expect(groups.map((g) => g.month)).toEqual(['August 2026', 'July 2026']);
    expect(groups[1].items).toHaveLength(2);
  });
});
