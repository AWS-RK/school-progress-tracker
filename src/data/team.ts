import { supabase } from '../supabaseClient';
import type { TeamMember, TeamRole, TeamScope } from '../lib/types';

interface TeamRow {
  id: string;
  profile_id: string;
  user_id: string | null;
  name: string;
  title: string;
  role: TeamRole;
  scope: TeamScope;
  invited_email: string;
}

function toTeamMember(row: TeamRow): TeamMember {
  return {
    id: row.id,
    profileId: row.profile_id,
    userId: row.user_id,
    name: row.name,
    title: row.title,
    role: row.role,
    scope: row.scope,
    invitedEmail: row.invited_email,
  };
}

export async function fetchTeam(profileId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, profile_id, user_id, name, title, role, scope, invited_email')
    .eq('profile_id', profileId);

  if (error) throw error;
  return (data as TeamRow[]).map(toTeamMember);
}

export interface NewTeamMember {
  profileId: string;
  name: string;
  title: string;
  email: string;
  role: TeamRole;
  scope: TeamScope;
}

export async function inviteTeamMember(input: NewTeamMember): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      profile_id: input.profileId,
      name: input.name,
      title: input.title,
      role: input.role,
      scope: input.scope,
      invited_email: input.email,
    })
    .select('id, profile_id, user_id, name, title, role, scope, invited_email')
    .single();

  if (error) throw error;

  const { error: inviteError } = await supabase.auth.signInWithOtp({
    email: input.email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (inviteError) throw inviteError;

  return toTeamMember(data as TeamRow);
}

export async function removeTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  if (error) throw error;
}
