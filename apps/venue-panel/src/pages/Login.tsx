import { useState } from 'react';
import { api } from '../lib/api';
import { LoginScene } from '../components/LoginScene';

export function Login({ onLoggedIn }: { onLoggedIn: (token: string) => void }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token } = await api.login(identifier, password);
      localStorage.setItem('token', token);
      onLoggedIn(token);
    } catch {
      setError('Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-wrap">
      <LoginScene />
      <form onSubmit={submit} className="login-card">
        <span className="brand login-brand">
          Kara<span className="dot">bol</span>
        </span>
        <h1>Venue login</h1>
        <p className="login-sub">Access your queue, redemptions, and venue tools.</p>
        <label className="login-field">
          <span>Email or phone</span>
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoFocus />
        </label>
        <label className="login-field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="msg-error">{error}</p>}
        <button type="submit" className="btn" disabled={submitting || !identifier || !password}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
