import { useState } from 'react';
import { Login } from './pages/Login';
import { QueueDashboard } from './pages/QueueDashboard';

// TODO: pull venueId from the authenticated staff user once venue selection lands.
const DEV_VENUE_ID = import.meta.env.VITE_DEV_VENUE_ID ?? '';

export function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  if (!token) return <Login onLoggedIn={setToken} />;
  return <QueueDashboard venueId={DEV_VENUE_ID} token={token} />;
}
