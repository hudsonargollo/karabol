import { useState } from 'react';
import { Login } from './pages/Login';
import { QueueDashboard } from './pages/QueueDashboard';
import { RedeemPage } from './pages/RedeemPage';

// TODO: pull venueId from the authenticated staff user once venue selection lands.
const DEV_VENUE_ID = import.meta.env.VITE_DEV_VENUE_ID ?? '';

export function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [tab, setTab] = useState<'queue' | 'redeem'>('queue');

  if (!token) return <Login onLoggedIn={setToken} />;

  return (
    <div>
      <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #ddd', fontFamily: 'system-ui' }}>
        <button onClick={() => setTab('queue')} disabled={tab === 'queue'}>
          Live Queue
        </button>
        <button onClick={() => setTab('redeem')} disabled={tab === 'redeem'}>
          Redeem
        </button>
      </nav>
      {tab === 'queue' ? <QueueDashboard venueId={DEV_VENUE_ID} token={token} /> : <RedeemPage />}
    </div>
  );
}
