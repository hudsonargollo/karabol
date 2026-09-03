import { useEffect, useMemo, useState } from 'react';
import { Login } from './pages/Login';
import { QueueDashboard } from './pages/QueueDashboard';
import { RedeemPage } from './pages/RedeemPage';
import { AdminPage } from './pages/AdminPage';
import { decodeToken } from './lib/auth';

// TODO: pull venueId from the authenticated staff user once venue selection lands.
const DEV_VENUE_ID = import.meta.env.VITE_DEV_VENUE_ID ?? '';

type Tab = 'queue' | 'redeem' | 'admin';

export function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const claims = useMemo(() => (token ? decodeToken(token) : null), [token]);
  const isSuperAdmin = claims?.role === 'SUPER_ADMIN';
  const [tab, setTab] = useState<Tab>(isSuperAdmin ? 'admin' : 'queue');

  // Login doesn't remount App, so the tab picked at first render (before a
  // token exists) can go stale the moment a SUPER_ADMIN actually logs in.
  useEffect(() => {
    if (isSuperAdmin) setTab('admin');
  }, [isSuperAdmin]);

  if (!token) return <Login onLoggedIn={setToken} />;

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
  }

  return (
    <div className="app-shell">
      <nav className="topbar">
        <span className="brand">
          Kara<span className="dot">bol</span>
        </span>
        {isSuperAdmin && (
          <button className="tab-btn" onClick={() => setTab('admin')} disabled={tab === 'admin'}>
            Venues
          </button>
        )}
        <button className="tab-btn" onClick={() => setTab('queue')} disabled={tab === 'queue'}>
          Live Queue
        </button>
        <button className="tab-btn" onClick={() => setTab('redeem')} disabled={tab === 'redeem'}>
          Redeem
        </button>
        <span style={{ flex: 1 }} />
        <button className="tab-btn" onClick={logout}>
          Log out
        </button>
      </nav>
      {tab === 'admin' && isSuperAdmin ? (
        <AdminPage />
      ) : tab === 'queue' ? (
        <QueueDashboard venueId={DEV_VENUE_ID} token={token} />
      ) : (
        <RedeemPage />
      )}
    </div>
  );
}
