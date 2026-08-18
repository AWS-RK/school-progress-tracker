import { useState, type FormEvent } from 'react';
import { supabase } from '../supabaseClient';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setErrorMessage(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="app-shell" style={{ justifyContent: 'center', padding: 20 }}>
      <h3 style={{ marginBottom: 4 }}>Tanvi's Progress Tracker</h3>
      <p className="text-muted" style={{ marginBottom: 20 }}>
        Sign in with your email to view Tanvi's progress.
      </p>
      {status === 'sent' ? (
        <p>Check your email for a sign-in link.</p>
      ) : (
        <form onSubmit={handleSubmit} className="field" style={{ gap: 12, display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            required
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn btn-primary btn-block" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending link…' : 'Send sign-in link'}
          </button>
          {status === 'error' && (
            <p style={{ color: 'var(--color-accent-700)', fontSize: 13 }}>{errorMessage}</p>
          )}
        </form>
      )}
    </div>
  );
}
