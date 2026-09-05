import { useEffect, useState } from 'react';
import { SocketEvent, type QueueEntry } from '@karaokebo/shared';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

// 3.2 Live Queue Dashboard — master view with manual override controls.
export function QueueDashboard({ venueId, token }: { venueId: string; token: string }) {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [nowPlaying, setNowPlaying] = useState<QueueEntry | null>(null);
  const [liveScore, setLiveScore] = useState<number | null>(null);

  useEffect(() => {
    api.getQueue(venueId).then((data) => setEntries(data as QueueEntry[]));

    const socket = getSocket(token);
    socket.emit(SocketEvent.QUEUE_JOIN, venueId);

    socket.on(SocketEvent.QUEUE_STATE, () => {
      api.getQueue(venueId).then((data) => setEntries(data as QueueEntry[]));
    });
    socket.on(SocketEvent.NOW_PLAYING, (entry: QueueEntry) => {
      setNowPlaying(entry);
      setLiveScore(null);
    });
    socket.on(SocketEvent.SCORE_UPDATE, (payload: { value: number }) => setLiveScore(payload.value));

    return () => {
      socket.emit(SocketEvent.QUEUE_LEAVE, venueId);
      socket.off(SocketEvent.QUEUE_STATE);
      socket.off(SocketEvent.NOW_PLAYING);
      socket.off(SocketEvent.SCORE_UPDATE);
    };
  }, [venueId, token]);

  return (
    <div className="page">
      <h1>Live Queue</h1>

      <div className="card">
        <h2>Now Playing</h2>
        {nowPlaying ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{nowPlaying.title}</p>
              <span className="score-num">{liveScore ?? '—'}</span>
            </div>
            <div className="field-row">
              <button className="btn" onClick={() => api.completeSong(venueId, nowPlaying.id)}>
                Complete
              </button>
              <button className="btn btn-ghost" onClick={() => api.skipSong(venueId, nowPlaying.id)}>
                Skip
              </button>
            </div>
          </div>
        ) : (
          <button className="btn" onClick={() => api.advanceQueue(venueId)}>
            Play next
          </button>
        )}
      </div>

      <div className="card">
        <h2>Pending ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="empty-state">No one in the queue right now.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ width: 100, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                      Table {entry.tableId}
                    </td>
                    <td>{entry.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
