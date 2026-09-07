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
  const [newTableQr, setNewTableQr] = useState<{ label: string; pin: string; qrImageDataUrl: string } | null>(null);

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
      const table = await api.createVenueTable(tableVenueId, tableLabel.trim());
      setTableLabel('');
      setNewTableQr({ label: table.label, pin: table.pin, qrImageDataUrl: table.qrImageDataUrl });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the table');
    }
  }

  return (
    <div className="page page-wide">
      <h1>Venues</h1>
      {error && <p className="msg-error">{error}</p>}
      {notice && <p className="msg-success">{notice}</p>}

      <div className="card">
        {venues.length === 0 ? (
          <p className="empty-state">No venues yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Tables</th>
                  <th>Users</th>
                  <th>POS</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 700 }}>{v.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>{v.slug}</td>
                    <td>{v._count.tables}</td>
                    <td>{v._count.users}</td>
                    <td>{v.posProvider ?? <span className="empty-state">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>New venue</h2>
        <div className="field-row">
          <input placeholder="Venue name" value={venueName} onChange={(e) => setVenueName(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
          <button className="btn" onClick={createVenue} disabled={!venueName.trim()}>
            Create
          </button>
        </div>
      </div>

      <div className="card">
        <h2>New staff login</h2>
        <div className="field-grid" style={{ marginBottom: 10 }}>
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
        <button className="btn" onClick={createStaff} disabled={!staffVenueId || !staffName.trim() || staffPassword.length < 8}>
          Create login
        </button>
      </div>

      <div className="card">
        <h2>New table</h2>
        <div className="field-row">
          <select value={tableVenueId} onChange={(e) => setTableVenueId(e.target.value)}>
            <option value="">Select a venue…</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Table label (e.g. Mesa 1)"
            value={tableLabel}
            onChange={(e) => setTableLabel(e.target.value)}
            style={{ flex: 1, minWidth: 180 }}
          />
          <button className="btn" onClick={createTable} disabled={!tableVenueId || !tableLabel.trim()}>
            Create
          </button>
        </div>

        {newTableQr && (
          <div className="table-qr">
            <img src={newTableQr.qrImageDataUrl} alt={`QR for ${newTableQr.label}`} width={200} height={200} />
            <div>
              <p style={{ fontWeight: 700 }}>{newTableQr.label}</p>
              <p className="empty-state">PIN fallback: {newTableQr.pin}</p>
              <p className="empty-state">Print this QR for the table — it won't be shown again here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
