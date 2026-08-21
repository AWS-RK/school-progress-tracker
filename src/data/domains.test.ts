import { describe, it, expect } from 'vitest';
import { domainPercent, domainLastAssessedAt } from './domains';
import type { Domain, Skill } from '../lib/types';

function makeSkill(overrides: Partial<Skill>): Skill {
  return {
    id: 'skill-1',
    domainId: 'domain-1',
    name: 'Skill',
    sortOrder: 0,
    percent: 0,
    lastAssessedAt: '1970-01-01',
    ...overrides,
  };
}

function makeDomain(skills: Skill[]): Domain {
  return {
    id: 'domain-1',
    profileId: 'profile-1',
    name: 'Domain',
    icon: '📘',
    sortOrder: 0,
    skills,
  };
}

describe('domainPercent', () => {
  it('averages the percent of each skill in the domain', () => {
    const domain = makeDomain([
      makeSkill({ id: 's1', percent: 40 }),
      makeSkill({ id: 's2', percent: 70 }),
      makeSkill({ id: 's3', percent: 100 }),
    ]);
    expect(domainPercent(domain)).toBe(70);
  });

  it('returns 0 for a domain with no skills', () => {
    const domain = makeDomain([]);
    expect(domainPercent(domain)).toBe(0);
  });
});

describe('domainLastAssessedAt', () => {
  it('returns the latest lastAssessedAt across skills, even when it is not the last element', () => {
    const domain = makeDomain([
      makeSkill({ id: 's1', lastAssessedAt: '2026-03-01' }),
      makeSkill({ id: 's2', lastAssessedAt: '2026-08-15' }),
      makeSkill({ id: 's3', lastAssessedAt: '2026-05-10' }),
    ]);
    expect(domainLastAssessedAt(domain)).toBe('2026-08-15');
  });

  it('returns the 1970-01-01 sentinel for a domain with no skills, without throwing', () => {
    const domain = makeDomain([]);
    expect(() => domainLastAssessedAt(domain)).not.toThrow();
    expect(domainLastAssessedAt(domain)).toBe('1970-01-01');
  });
});
