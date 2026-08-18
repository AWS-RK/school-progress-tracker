import { describe, it, expect } from 'vitest';
import { percentToLevel, goalStatus, average } from './levels';

describe('percentToLevel', () => {
  it('returns Emerging below 31', () => {
    expect(percentToLevel(0)).toBe('Emerging');
    expect(percentToLevel(30)).toBe('Emerging');
  });
  it('returns Developing from 31 to 60', () => {
    expect(percentToLevel(31)).toBe('Developing');
    expect(percentToLevel(60)).toBe('Developing');
  });
  it('returns Secure from 61 to 85', () => {
    expect(percentToLevel(61)).toBe('Secure');
    expect(percentToLevel(85)).toBe('Secure');
  });
  it('returns Independent at 86 and above', () => {
    expect(percentToLevel(86)).toBe('Independent');
    expect(percentToLevel(100)).toBe('Independent');
  });
});

describe('goalStatus', () => {
  it('returns Needs Support below 35', () => {
    expect(goalStatus(0)).toBe('Needs Support');
    expect(goalStatus(34)).toBe('Needs Support');
  });
  it('returns In Progress from 35 to 69', () => {
    expect(goalStatus(35)).toBe('In Progress');
    expect(goalStatus(69)).toBe('In Progress');
  });
  it('returns On Track at 70 and above', () => {
    expect(goalStatus(70)).toBe('On Track');
    expect(goalStatus(100)).toBe('On Track');
  });
});

describe('average', () => {
  it('rounds to the nearest integer', () => {
    expect(average([55, 35, 60, 50])).toBe(50);
  });
  it('returns 0 for an empty array', () => {
    expect(average([])).toBe(0);
  });
});
