import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, User as UserIcon, MessageSquare, ClipboardCheck, Paperclip, Plus } from 'lucide-react';
import { PROFILE_ID } from '../App';
import { fetchDomains, domainPercent } from '../data/domains';
import { fetchGoals } from '../data/goals';
import { fetchTimeline, getAttachmentSignedUrl } from '../data/timeline';
import { percentToLevel, goalStatus } from '../lib/levels';
import { fmtDateShort } from '../lib/dates';
import { attachmentDisplayName } from '../lib/attachments';
import ProgressBar from '../components/ProgressBar';
import Tag from '../components/Tag';
import type { Domain, Goal, TimelineEntry, GoalStatus } from '../lib/types';

const SOURCE_ICONS = { parent: UserIcon, teacher: MessageSquare, assessment: ClipboardCheck };
const SOURCE_LABELS = { parent: 'Parent', teacher: 'Teacher', assessment: 'Assessment' };
const STATUS_VARIANT: Record<GoalStatus, 'neutral' | 'accent' | 'outline'> = {
  'On Track': 'neutral',
  'Needs Support': 'accent',
  'In Progress': 'outline',
};

export default function DomainDetail() {
  const navigate = useNavigate();
  const { domainId } = useParams();
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

  if (loading) return <div className="screen-no-tabs" style={{ padding: 20 }}>Loading…</div>;

  const domain = domains.find((d) => d.id === domainId);
  if (!domain) return <div className="screen-no-tabs" style={{ padding: 20 }}>Domain not found.</div>;

  const percent = domainPercent(domain);
  const domainGoals = goals.filter((g) => g.domainId === domainId);
  const history = timeline.filter((e) => e.domainId === domainId);

  return (
    <div className="screen-no-tabs">
      <div className="header-bar" style={{ justifyContent: 'flex-start' }}>
        <button className="icon-btn-plain" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft width={20} height={20} />
        </button>
        <h3 style={{ margin: 0, fontSize: 19 }}>{domain.name}</h3>
      </div>

      <div style={{ padding: 20 }}>
        <h6 style={{ margin: 0 }}>Overall</h6>
        <div style={{ fontSize: 30, fontFamily: 'var(--font-heading)', fontWeight: 800, marginTop: 6 }}>
          {percentToLevel(percent)}
        </div>
        <div style={{ marginTop: 10 }}>
          <ProgressBar percent={percent} />
        </div>
      </div>

      <div style={{ padding: '6px 20px 8px' }}>
        <h6 style={{ margin: '0 0 8px' }}>Skills</h6>
        {domain.skills.map((s) => (
          <div key={s.id} style={{ padding: '10px 0', borderBottom: '2px solid var(--color-neutral-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span>{s.name}</span>
              <span style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>{percentToLevel(s.percent)}</span>
            </div>
            <ProgressBar percent={s.percent} thin />
            <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--color-text) 50%, transparent)', marginTop: 4 }}>
              Last assessed {fmtDateShort(s.lastAssessedAt)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 20px 8px' }}>
        <h6 style={{ margin: '0 0 8px' }}>IEP Goals in this Area</h6>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {domainGoals.map((g) => {
            const status = goalStatus(g.percent);
            return (
              <div key={g.id} className="card elev-sm">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Tag variant={STATUS_VARIANT[status]}>{status}</Tag>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{g.title}</div>
                <ProgressBar percent={g.percent} thin />
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '16px 20px 8px' }}>
        <h6 style={{ margin: '0 0 4px' }}>History</h6>
        {history.map((e) => {
          const SourceIcon = SOURCE_ICONS[e.source];
          return (
            <div key={e.id} style={{ padding: '12px 0', borderBottom: '2px solid var(--color-neutral-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
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
                    } catch {
                      // signed URL fetch failed; silently ignore for now, matches the app's existing
                      // lack of toast/notification system for background actions
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

      <div style={{ padding: '8px 20px 24px' }}>
        <button className="btn btn-secondary btn-block" onClick={() => navigate(`/add?domain=${domain.id}`)}>
          <Plus width={16} height={16} />
          &nbsp;Log an update
        </button>
      </div>
    </div>
  );
}
