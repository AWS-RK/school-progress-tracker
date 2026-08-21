import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { PROFILE_ID } from '../App';
import { fetchTeam, removeTeamMember } from '../data/team';
import type { TeamMember, TeamRole } from '../lib/types';

const ROLE_LABELS: Record<TeamRole, string> = {
  family: 'Family',
  school_staff: 'School staff',
  service_provider: 'Outside providers',
};

const ROLE_ORDER: TeamRole[] = ['family', 'school_staff', 'service_provider'];

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('');
}

export default function Profile() {
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam(PROFILE_ID).then((t) => {
      setTeam(t);
      setLoading(false);
    });
  }, []);

  async function handleRemove(id: string) {
    await removeTeamMember(id);
    setTeam((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) return <div className="screen" style={{ padding: 20 }}>Loading…</div>;

  return (
    <div className="screen">
      <div className="header-bar" style={{ justifyContent: 'flex-start' }}>
        <h3 style={{ margin: 0, fontSize: 20 }}>Profile</h3>
      </div>
      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, background: 'var(--color-accent)', color: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 26, flexShrink: 0 }}>
          T
        </div>
        <div>
          <div style={{ fontSize: 19, fontFamily: 'var(--font-heading)', fontWeight: 800 }}>Tanvi</div>
          <div style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)', marginTop: 2 }}>5th Grade (Year 2)</div>
        </div>
      </div>
      <div style={{ borderTop: '2px solid var(--color-divider)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '2px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>IEP status</span>
          <span style={{ fontSize: 13 }}>Active</span>
        </div>
        <div style={{ padding: '14px 20px', borderBottom: '2px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>Last re-evaluation</span>
          <span style={{ fontSize: 13 }}>Jul 28, 2026</span>
        </div>
        <div style={{ padding: '14px 20px', borderBottom: '2px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>Next annual review</span>
          <span style={{ fontSize: 13 }}>May 2027</span>
        </div>
      </div>
      <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h6 style={{ margin: 0 }}>Tanvi's Team · {team.length}</h6>
        <span
          style={{ fontSize: 12, color: 'var(--color-accent-700)', fontFamily: 'var(--font-heading)', fontWeight: 800, cursor: 'pointer' }}
          onClick={() => navigate('/share')}
        >
          + Invite
        </span>
      </div>
      {ROLE_ORDER.map((role) => {
        const people = team.filter((p) => p.role === role);
        if (people.length === 0) return null;
        return (
          <div key={role}>
            <div style={{ padding: '12px 20px 6px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>
              {ROLE_LABELS[role]}
            </div>
            {people.map((p) => (
              <div key={p.id} style={{ padding: '12px 20px', borderBottom: '2px solid var(--color-neutral-200)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, flexShrink: 0, background: 'var(--color-neutral-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 12 }}>
                  {initials(p.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginTop: 2 }}>
                    {p.title} · {p.scope === 'full' ? 'Full progress' : 'Academic only'}
                  </div>
                </div>
                <X width={16} height={16} style={{ cursor: 'pointer', opacity: 0.6, flexShrink: 0 }} onClick={() => handleRemove(p.id)} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
