import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { PROFILE_ID } from '../App';
import { inviteTeamMember } from '../data/team';
import type { TeamRole, TeamScope } from '../lib/types';

const ROLES: { id: TeamRole; label: string }[] = [
  { id: 'family', label: 'Family' },
  { id: 'school_staff', label: 'School staff' },
  { id: 'service_provider', label: 'Service provider' },
];
const SCOPES: { id: TeamScope; label: string }[] = [
  { id: 'full', label: 'Full progress' },
  { id: 'academic_only', label: 'Academic only' },
];

export default function ShareInvite() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('family');
  const [scope, setScope] = useState<TeamScope>('full');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    setError('');
    try {
      await inviteTeamMember({
        profileId: PROFILE_ID,
        name: name.trim(),
        title: title.trim() || ROLES.find((r) => r.id === role)!.label,
        email: email.trim(),
        role,
        scope,
      });
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite.');
      setSaving(false);
    }
  }

  return (
    <div className="screen-no-tabs">
      <div className="header-bar">
        <h3 style={{ margin: 0, fontSize: 19 }}>Invite to Team</h3>
        <button className="icon-btn-plain" onClick={() => navigate(-1)} aria-label="Close">
          <X width={20} height={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" className="input" type="text" placeholder="e.g. Dana Wells" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="title">Role on the team</label>
          <input id="title" className="input" type="text" placeholder="e.g. Private speech therapist" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Group</label>
          <div className="segmented-3">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.id}
                className="segmented-opt"
                style={{ background: role === r.id ? 'var(--color-accent)' : 'transparent', color: role === r.id ? 'var(--color-bg)' : 'var(--color-text)' }}
                onClick={() => setRole(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>What to share</label>
          <div className="segmented-3">
            {SCOPES.map((s) => (
              <button
                type="button"
                key={s.id}
                className="segmented-opt"
                style={{ background: scope === s.id ? 'var(--color-accent)' : 'transparent', color: scope === s.id ? 'var(--color-bg)' : 'var(--color-text)' }}
                onClick={() => setScope(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', margin: 0 }}>
          They'll get view-only access and an email invite. You can revoke access anytime from Profile.
        </p>
        {error && <p style={{ color: 'var(--color-accent-700)', fontSize: 13, margin: 0 }}>{error}</p>}
        <button className="btn btn-primary btn-block" style={{ justifyContent: 'center' }} type="submit" disabled={saving || !name.trim() || !email.trim()}>
          {saving ? 'Sending…' : 'Send Invite'}
        </button>
      </form>
    </div>
  );
}
