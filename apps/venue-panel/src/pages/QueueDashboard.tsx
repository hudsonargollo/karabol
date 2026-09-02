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
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Live Queue</h1>

      <section>
        <h2>Now Playing</h2>
        {nowPlaying ? (
          <div>
            <p>{nowPlaying.title}</p>
            <p>Score: {liveScore ?? '—'}</p>
            <button onClick={() => api.completeSong(venueId, nowPlaying.id)}>Complete</button>
            <button onClick={() => api.skipSong(venueId, nowPlaying.id)}>Skip</button>
          </div>
        ) : (
          <button onClick={() => api.advanceQueue(venueId)}>Play next</button>
        )}
      </section>

      <section>
        <h2>Pending ({entries.length})</h2>
        <ul>
          {entries.map((entry) => (
            <li key={entry.id}>
              [Table {entry.tableId}] {entry.title}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
