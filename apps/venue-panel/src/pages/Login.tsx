import { useState } from 'react';
import { api } from '../lib/api';

export function Login({ onLoggedIn }: { onLoggedIn: (token: string) => void }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { token } = await api.login(identifier, password);
      localStorage.setItem('token', token);
      onLoggedIn(token);
    } catch {
      setError('Invalid credentials');
    }
  }

  return (
    <form onSubmit={submit} style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 320 }}>
      <h1>Venue Login</h1>
      <input placeholder="Email or phone" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Log in</button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </form>
  );
}
