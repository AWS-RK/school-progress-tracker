import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, MessageSquare, ClipboardCheck, Paperclip } from 'lucide-react';
import { PROFILE_ID } from '../App';
import { fetchDomains } from '../data/domains';
import { fetchTimeline } from '../data/timeline';
import { fmtDateShort, groupByMonth } from '../lib/dates';
import { attachmentDisplayName } from '../lib/attachments';
import Tag from '../components/Tag';
import type { Domain, TimelineEntry } from '../lib/types';

const SOURCE_ICONS = { parent: UserIcon, teacher: MessageSquare, assessment: ClipboardCheck };
const SOURCE_LABELS = { parent: 'Parent', teacher: 'Teacher', assessment: 'Assessment' };

export default function Timeline() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDomains(PROFILE_ID), fetchTimeline(PROFILE_ID)]).then(([d, t]) => {
      setDomains(d);
      setTimeline(t);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="screen" style={{ padding: 20 }}>Loading…</div>;

  const filtered = timeline.filter((e) => filter === 'all' || e.domainId === filter);
  const groups = groupByMonth(filtered, (e) => e.occurredAt);
  const filters = [{ id: 'all', label: 'All' }, ...domains.map((d) => ({ id: d.id, label: d.name }))];

  return (
    <div className="screen">
      <div className="header-bar" style={{ justifyContent: 'flex-start' }}>
        <h3 style={{ margin: 0, fontSize: 20 }}>Timeline</h3>
      </div>
      <div className="chip-row">
        {filters.map((f) => (
          <span
            key={f.id}
            className={`tag ${filter === f.id ? 'tag-accent' : 'tag-outline'}`}
            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </span>
        ))}
      </div>
      {groups.map((grp) => (
        <div key={grp.month}>
          <div
            style={{
              padding: '16px 20px 6px',
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              color: 'color-mix(in srgb, var(--color-text) 60%, transparent)',
            }}
          >
            {grp.month}
          </div>
          {grp.items.map((e) => {
            const domain = domains.find((d) => d.id === e.domainId);
            const SourceIcon = SOURCE_ICONS[e.source];
            return (
              <div key={e.id} className="entry-row" onClick={() => navigate(`/domain/${e.domainId}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <Tag variant="accent-2">{domain?.name}</Tag>
                  <Tag variant="neutral">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <SourceIcon width={11} height={11} />
                      {SOURCE_LABELS[e.source]}
                    </span>
                  </Tag>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>{e.note}</div>
                {e.attachmentUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 11, color: 'var(--color-accent-700)' }}>
                    <Paperclip width={11} height={11} />
                    {attachmentDisplayName(e.attachmentUrl)}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--color-text) 50%, transparent)', marginTop: 4 }}>
                  {fmtDateShort(e.occurredAt)} · {e.level}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
