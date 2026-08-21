import { supabase } from '../supabaseClient';
import type { Level, Source, TimelineEntry } from '../lib/types';

interface TimelineRow {
  id: string;
  profile_id: string;
  domain_id: string;
  author_id: string | null;
  source: Source;
  level: Level;
  note: string;
  attachment_url: string | null;
  occurred_at: string;
}

function toTimelineEntry(row: TimelineRow): TimelineEntry {
  return {
    id: row.id,
    profileId: row.profile_id,
    domainId: row.domain_id,
    authorId: row.author_id,
    source: row.source,
    level: row.level,
    note: row.note,
    attachmentUrl: row.attachment_url,
    occurredAt: row.occurred_at,
  };
}

export async function fetchTimeline(profileId: string): Promise<TimelineEntry[]> {
  const { data, error } = await supabase
    .from('timeline_entries')
    .select('id, profile_id, domain_id, author_id, source, level, note, attachment_url, occurred_at')
    .eq('profile_id', profileId)
    .order('occurred_at', { ascending: false });

  if (error) throw error;
  return (data as TimelineRow[]).map(toTimelineEntry);
}

export interface NewTimelineEntry {
  profileId: string;
  domainId: string;
  source: Source;
  level: Level;
  note: string;
  occurredAt: string;
  attachmentFile: File | null;
}

export async function uploadAttachment(profileId: string, file: File): Promise<string> {
  const path = `${profileId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('attachments').upload(path, file);
  if (error) throw error;
  return path;
}

export async function createTimelineEntry(entry: NewTimelineEntry): Promise<TimelineEntry> {
  let attachmentUrl: string | null = null;
  if (entry.attachmentFile) {
    attachmentUrl = await uploadAttachment(entry.profileId, entry.attachmentFile);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('timeline_entries')
    .insert({
      profile_id: entry.profileId,
      domain_id: entry.domainId,
      author_id: user?.id ?? null,
      source: entry.source,
      level: entry.level,
      note: entry.note,
      attachment_url: attachmentUrl,
      occurred_at: entry.occurredAt,
    })
    .select('id, profile_id, domain_id, author_id, source, level, note, attachment_url, occurred_at')
    .single();

  if (error) throw error;
  return toTimelineEntry(data as TimelineRow);
}
