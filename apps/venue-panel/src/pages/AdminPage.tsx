import { useEffect, useState } from 'react';
import { api, type Venue } from '../lib/api';

// SUPER_ADMIN console — onboard venues, staff logins, and tables from one screen
// instead of touching the database by hand.
export function AdminPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [venueName, setVenueName] = useState('');

  const [staffVenueId, setStaffVenueId] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'VENUE_ADMIN' | 'VENUE_STAFF'>('VENUE_ADMIN');

  const [tableVenueId, setTableVenueId] = useState('');
  const [tableLabel, setTableLabel] = useState('');

  async function refresh() {
    try {
      setVenues(await api.listVenues());
    } catch {
      setError('Could not load venues');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createVenue() {
    setError(null);
    setNotice(null);
    try {
      const venue = await api.createVenue(venueName.trim());
      setVenueName('');
      setNotice(`Venue "${venue.name}" created (slug: ${venue.slug})`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create venue');
    }
  }

  async function createStaff() {
    setError(null);
    setNotice(null);
    try {
      const staff = await api.createVenueStaff(staffVenueId, {
        displayName: staffName.trim(),
        email: staffEmail.trim() || undefined,
        password: staffPassword,
        role: staffRole,
      });
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setNotice(`Login created for ${staff.displayName} (${staff.role}) — share the password separately.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the staff login');
    }
  }

  async function createTable() {
    setError(null);
    setNotice(null);
    try {
      await api.createVenueTable(tableVenueId, tableLabel.trim());
      setTableLabel('');
      setNotice('Table created.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the table');
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 720 }}>
      <h1>Venues</h1>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {notice && <p style={{ color: 'seagreen' }}>{notice}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Slug</th>
            <th style={{ padding: 8 }}>Tables</th>
            <th style={{ padding: 8 }}>Users</th>
            <th style={{ padding: 8 }}>POS</th>
          </tr>
        </thead>
        <tbody>
          {venues.map((v) => (
            <tr key={v.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{v.name}</td>
              <td style={{ padding: 8 }}>{v.slug}</td>
              <td style={{ padding: 8 }}>{v._count.tables}</td>
              <td style={{ padding: 8 }}>{v._count.users}</td>
              <td style={{ padding: 8 }}>{v.posProvider ?? '—'}</td>
            </tr>
          ))}
          {venues.length === 0 && (
            <tr>
              <td style={{ padding: 8 }} colSpan={5}>
                No venues yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>New venue</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Venue name" value={venueName} onChange={(e) => setVenueName(e.target.value)} style={{ flex: 1 }} />
          <button onClick={createVenue} disabled={!venueName.trim()}>
            Create
          </button>
        </div>
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>New staff login</h2>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <select value={staffVenueId} onChange={(e) => setStaffVenueId(e.target.value)}>
            <option value="">Select a venue…</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <select value={staffRole} onChange={(e) => setStaffRole(e.target.value as 'VENUE_ADMIN' | 'VENUE_STAFF')}>
            <option value="VENUE_ADMIN">Venue admin</option>
            <option value="VENUE_STAFF">Venue staff</option>
          </select>
          <input placeholder="Display name" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
          <input placeholder="Email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} />
          <input
            placeholder="Password"
            type="password"
            value={staffPassword}
            onChange={(e) => setStaffPassword(e.target.value)}
          />
        </div>
        <button
          style={{ marginTop: 8 }}
          onClick={createStaff}
          disabled={!staffVenueId || !staffName.trim() || staffPassword.length < 8}
        >
          Create login
        </button>
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>New table</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={tableVenueId} onChange={(e) => setTableVenueId(e.target.value)}>
            <option value="">Select a venue…</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <input placeholder="Table label (e.g. Mesa 1)" value={tableLabel} onChange={(e) => setTableLabel(e.target.value)} style={{ flex: 1 }} />
          <button onClick={createTable} disabled={!tableVenueId || !tableLabel.trim()}>
            Create
          </button>
        </div>
      </section>
    </div>
  );
}
