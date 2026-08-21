import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Paperclip, FileCheck2 } from 'lucide-react';
import { PROFILE_ID } from '../App';
import { fetchDomains } from '../data/domains';
import { createTimelineEntry } from '../data/timeline';
import type { Domain, Level, Source } from '../lib/types';

const LEVELS: Level[] = ['Emerging', 'Developing', 'Secure', 'Independent'];
const SOURCES: { id: Source; label: string }[] = [
  { id: 'parent', label: 'Parent' },
  { id: 'teacher', label: 'Teacher' },
  { id: 'assessment', label: 'Assessment' },
];

export default function AddEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainId, setDomainId] = useState('');
  const [source, setSource] = useState<Source>('parent');
  const [level, setLevel] = useState<Level>('Developing');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDomains(PROFILE_ID).then((d) => {
      setDomains(d);
      const fromQuery = searchParams.get('domain');
      setDomainId(fromQuery && d.some((dom) => dom.id === fromQuery) ? fromQuery : d[0]?.id ?? '');
    });
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    setError('');
    try {
      await createTimelineEntry({
        profileId: PROFILE_ID,
        domainId,
        source,
        level,
        note: note.trim(),
        occurredAt: date,
        attachmentFile: attachment,
      });
      navigate('/timeline');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save update.');
      setSaving(false);
    }
  }

  return (
    <div className="screen-no-tabs">
      <div className="header-bar">
        <h3 style={{ margin: 0, fontSize: 19 }}>Log an Update</h3>
        <button className="icon-btn-plain" onClick={() => navigate(-1)} aria-label="Close">
          <X width={20} height={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="field">
          <label>Area</label>
          <div className="segmented-3">
            {domains.map((d) => (
              <button
                type="button"
                key={d.id}
                className="segmented-opt"
                style={{
                  background: domainId === d.id ? 'var(--color-accent)' : 'transparent',
                  color: domainId === d.id ? 'var(--color-bg)' : 'var(--color-text)',
                }}
                onClick={() => setDomainId(d.id)}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Source</label>
          <div className="segmented-3">
            {SOURCES.map((s) => (
              <button
                type="button"
                key={s.id}
                className="segmented-opt"
                style={{
                  background: source === s.id ? 'var(--color-accent)' : 'transparent',
                  color: source === s.id ? 'var(--color-bg)' : 'var(--color-text)',
                }}
                onClick={() => setSource(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="level">Level</label>
          <select id="level" className="input" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="note">Note</label>
          <textarea
            id="note"
            className="input"
            rows={4}
            placeholder="What did you notice?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Attach a photo or document</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px dashed var(--color-divider)', padding: 14, cursor: 'pointer', position: 'relative' }}>
            {attachment ? <FileCheck2 width={18} height={18} /> : <Paperclip width={18} height={18} />}
            <span style={{ fontSize: 13, color: attachment ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>
              {attachment ? attachment.name : 'Tap to attach a photo or document'}
            </span>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {error && <p style={{ color: 'var(--color-accent-700)', fontSize: 13, margin: 0 }}>{error}</p>}

        <button className="btn btn-primary btn-block" style={{ justifyContent: 'center' }} type="submit" disabled={saving || !note.trim()}>
          {saving ? 'Saving…' : 'Save Update'}
        </button>
      </form>
    </div>
  );
}
