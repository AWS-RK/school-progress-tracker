import type { Level, GoalStatus } from './types';

export function percentToLevel(percent: number): Level {
  if (percent >= 86) return 'Independent';
  if (percent >= 61) return 'Secure';
  if (percent >= 31) return 'Developing';
  return 'Emerging';
}

export function goalStatus(percent: number): GoalStatus {
  if (percent >= 70) return 'On Track';
  if (percent < 35) return 'Needs Support';
  return 'In Progress';
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}
