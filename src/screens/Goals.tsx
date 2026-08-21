import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROFILE_ID } from '../App';
import { fetchDomains } from '../data/domains';
import { fetchGoals } from '../data/goals';
import { goalStatus } from '../lib/levels';
import ProgressBar from '../components/ProgressBar';
import Tag from '../components/Tag';
import type { Domain, Goal, GoalStatus } from '../lib/types';

const STATUS_VARIANT: Record<GoalStatus, 'neutral' | 'accent' | 'outline'> = {
  'On Track': 'neutral',
  'Needs Support': 'accent',
  'In Progress': 'outline',
};

export default function Goals() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDomains(PROFILE_ID), fetchGoals(PROFILE_ID)]).then(([d, g]) => {
      setDomains(d);
      setGoals(g);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="screen" style={{ padding: 20 }}>Loading…</div>;

  const onTrackCount = goals.filter((g) => goalStatus(g.percent) === 'On Track').length;
  const onTrackPercent = goals.length ? Math.round((onTrackCount / goals.length) * 100) : 0;

  return (
    <div className="screen">
      <div className="header-bar" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <h3 style={{ margin: 0, fontSize: 20 }}>IEP Goals</h3>
        <div style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)', marginTop: 2 }}>
          2026–27 School Year
        </div>
      </div>
      <div style={{ padding: '16px 20px 4px' }}>
        <div style={{ fontSize: 13, marginBottom: 8 }}>
          {onTrackCount} of {goals.length} goals on track
        </div>
        <ProgressBar percent={onTrackPercent} />
      </div>
      <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {goals.map((g) => {
          const domain = domains.find((d) => d.id === g.domainId);
          const status = goalStatus(g.percent);
          return (
            <div key={g.id} className="card elev-sm" style={{ cursor: 'pointer' }} onClick={() => navigate(`/domain/${g.domainId}`)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span className="card-kicker" style={{ margin: 0 }}>{domain?.name}</span>
                <Tag variant={STATUS_VARIANT[status]}>{status}</Tag>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{g.title}</div>
              <ProgressBar percent={g.percent} />
              <div className="card-meta">{g.baseline} → {g.target}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
