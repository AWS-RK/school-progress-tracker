import { supabase } from '../supabaseClient';
import { average } from '../lib/levels';
import type { Domain } from '../lib/types';

interface SkillRow {
  id: string;
  domain_id: string;
  name: string;
  sort_order: number;
  skill_assessments: { percent: number; assessed_at: string }[];
}

interface DomainRow {
  id: string;
  profile_id: string;
  name: string;
  icon: string;
  sort_order: number;
  skills: SkillRow[];
}

function latestAssessment(
  rows: { percent: number; assessed_at: string }[]
): { percent: number; assessed_at: string } | undefined {
  return rows.reduce((a, b) => (a.assessed_at > b.assessed_at ? a : b), rows[0]);
}

export async function fetchDomains(profileId: string): Promise<Domain[]> {
  const { data, error } = await supabase
    .from('domains')
    .select('id, profile_id, name, icon, sort_order, skills(id, domain_id, name, sort_order, skill_assessments(percent, assessed_at))')
    .eq('profile_id', profileId)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data as unknown as DomainRow[]).map((d) => ({
    id: d.id,
    profileId: d.profile_id,
    name: d.name,
    icon: d.icon,
    sortOrder: d.sort_order,
    skills: [...d.skills]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => {
        const latest = latestAssessment(s.skill_assessments) ?? { percent: 0, assessed_at: '1970-01-01' };
        return {
          id: s.id,
          domainId: s.domain_id,
          name: s.name,
          sortOrder: s.sort_order,
          percent: latest.percent,
          lastAssessedAt: latest.assessed_at,
        };
      }),
  }));
}

export function domainPercent(domain: Domain): number {
  return average(domain.skills.map((s) => s.percent));
}

export function domainLastAssessedAt(domain: Domain): string {
  if (domain.skills.length === 0) return '1970-01-01';
  return domain.skills.reduce((a, b) => (a.lastAssessedAt > b.lastAssessedAt ? a : b)).lastAssessedAt;
}

export async function addSkillAssessment(skillId: string, percent: number, assessedAt: string) {
  const { error } = await supabase
    .from('skill_assessments')
    .insert({ skill_id: skillId, percent, assessed_at: assessedAt });
  if (error) throw error;
}
