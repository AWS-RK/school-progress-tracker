import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, User as UserIcon, ChevronRight, BookOpen, Brain, Shield, MessageSquare, ClipboardCheck, Paperclip, Pencil } from 'lucide-react';
import { PROFILE_ID } from '../App';
import { fetchDomains, domainPercent, domainLastAssessedAt } from '../data/domains';
import { fetchGoals } from '../data/goals';
import { fetchTimeline, getAttachmentSignedUrl } from '../data/timeline';
import { percentToLevel, goalStatus } from '../lib/levels';
import { fmtDateShort, monthsElapsed } from '../lib/dates';
import { attachmentDisplayName } from '../lib/attachments';
import ProgressBar from '../components/ProgressBar';
import Tag from '../components/Tag';
import type { Domain, Goal, TimelineEntry } from '../lib/types';

const DOMAIN_ICONS: Record<string, typeof BookOpen> = {
  'book-open': BookOpen,
  brain: Brain,
  shield: Shield,
  'message-square': MessageSquare,
  pencil: Pencil,
};
const SOURCE_ICONS = { parent: UserIcon, teacher: MessageSquare, assessment: ClipboardCheck };
const SOURCE_LABELS = { parent: 'Parent', teacher: 'Teacher', assessment: 'Assessment' };

export default function Home() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDomains(PROFILE_ID), fetchGoals(PROFILE_ID), fetchTimeline(PROFILE_ID)]).then(
      ([d, g, t]) => {
        setDomains(d);
        setGoals(g);
        setTimeline(t);
        setLoading(false);
      }
    );
  }, []);

  if (loading) return <div className="screen" style={{ padding: 20 }}>Loading…</div>;

  const monthsIn = monthsElapsed(new Date());
  const onTrackCount = goals.filter((g) => goalStatus(g.percent) === 'On Track').length;
  const recent = timeline.slice(0, 4);

  return (
    <div className="screen">
      <div className="header-bar">
        <div>
          <h3 style={{ margin: 0, fontSize: 22 }}>Tanvi</h3>
          <div style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)', marginTop: 2 }}>
            5th Grade (Year 2) · 2026–27
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" onClick={() => navigate('/share')} aria-label="Share">
            <Share2 width={18} height={18} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/profile')} aria-label="Profile">
            <UserIcon width={20} height={20} />
          </button>
        </div>
      </div>

      <div style={{ padding: '18px 20px 4px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-accent-700)', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
          Month {monthsIn} of 11
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {Array.from({ length: 11 }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 8, background: i < monthsIn ? 'var(--color-accent)' : 'var(--color-neutral-200)' }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '22px 20px 8px' }}>
        <h6 style={{ margin: '0 0 12px' }}>Progress by Area</h6>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {domains.map((d) => {
            const percent = domainPercent(d);
            const Icon = DOMAIN_ICONS[d.icon] ?? BookOpen;
            return (
              <div key={d.id} className="card elev-sm" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/domain/${d.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="card-kicker" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon width={13} height={13} />
                    {d.name}
                  </div>
                  <ChevronRight width={16} height={16} style={{ opacity: 0.5 }} />
                </div>
                <div className="card-title">{percentToLevel(percent)}</div>
                <p className="card-body">{d.skills.length} skills tracked</p>
                <ProgressBar percent={percent} />
                <div className="card-meta">Last updated {fmtDateShort(domainLastAssessedAt(d))}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '14px 20px 8px' }}>
        <div className="card elev-sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/goals')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="card-kicker">IEP Goals</div>
            <ChevronRight width={16} height={16} style={{ opacity: 0.5 }} />
          </div>
          <div className="card-title">{onTrackCount} of {goals.length} goals on track</div>
          <p className="card-body">2026–27 school year</p>
        </div>
      </div>

      <div style={{ padding: '20px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h6 style={{ margin: 0 }}>Recent Updates</h6>
        <span
          style={{ fontSize: 12, color: 'var(--color-accent-700)', fontFamily: 'var(--font-heading)', fontWeight: 800, cursor: 'pointer' }}
          onClick={() => navigate('/timeline')}
        >
          See all
        </span>
      </div>
      <div>
        {recent.map((e) => {
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
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 11, color: 'var(--color-accent-700)', cursor: 'pointer' }}
                  onClick={async (evt) => {
                    evt.stopPropagation();
                    try {
                      const url = await getAttachmentSignedUrl(e.attachmentUrl!);
                      window.open(url, '_blank', 'noopener,noreferrer');
                    } catch (err) {
                      console.error('Failed to open attachment', err);
                      alert('Could not open this attachment. It may no longer be available.');
                    }
                  }}
                >
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
    </div>
  );
}
