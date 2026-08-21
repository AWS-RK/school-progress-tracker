import { supabase } from '../supabaseClient';
import type { Goal } from '../lib/types';

interface GoalRow {
  id: string;
  profile_id: string;
  domain_id: string;
  title: string;
  baseline: string;
  target: string;
  percent: number;
}

export async function fetchGoals(profileId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('id, profile_id, domain_id, title, baseline, target, percent')
    .eq('profile_id', profileId);

  if (error) throw error;

  return (data as GoalRow[]).map((g) => ({
    id: g.id,
    profileId: g.profile_id,
    domainId: g.domain_id,
    title: g.title,
    baseline: g.baseline,
    target: g.target,
    percent: g.percent,
  }));
}
