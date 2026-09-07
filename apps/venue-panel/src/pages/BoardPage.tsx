import { useEffect, useState } from 'react';
import stageWide from '../assets/stage-wide.webp';
import logo from '../assets/logo.webp';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const POLL_MS = 5000;

interface BoardEntry {
  id: string;
  tableId: string;
  title: string;
  status: 'PENDING' | 'PLAYING' | 'COMPLETED' | 'SKIPPED';
  mode: 'SOLO' | 'DUO' | 'BATTLE';
  position: number;
}

interface BoardData {
  venueName: string;
  entries: BoardEntry[];
}

// 09 Bar TV / Tablet — an unauthenticated, ambient display for the venue's
// own screen: shows what's playing and who's next. Reads a public,
// read-only endpoint (GET /queue/:venueId/board) instead of the staff
// dashboard's authenticated one, since there's no login session on a TV.
// Polls rather than opening a socket — a few seconds of staleness doesn't
// matter for a passive display, and it keeps this page's auth surface at
// zero.
export function BoardPage({ venueId }: { venueId: string }) {
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`${API_URL}/queue/${venueId}/board`);
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as BoardData;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch {
        if (!cancelled) setError('No se pudo conectar con el bar.');
      }
    }

    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [venueId]);

  if (!venueId) {
    return (
      <div className="board-error">
        Falta el venue. Usa la URL <code>/board?venue=&lt;venueId&gt;</code>.
      </div>
    );
  }

  const nowPlaying = data?.entries.find((e) => e.status === 'PLAYING') ?? null;
  const upcoming = data?.entries.filter((e) => e.status === 'PENDING') ?? [];

  return (
    <div className="board">
      <div className="board-stage">
        <img src={stageWide} alt="" className="board-stage-img" />
        <img src={logo} alt="KARABOL" className="board-logo" />
        {nowPlaying ? (
          <div className="board-now">
            <div className="board-now-label">AHORA EN EL ESCENARIO</div>
            <div className="board-now-title">
              Mesa {nowPlaying.tableId} · &quot;{nowPlaying.title}&quot;
            </div>
            <div className="board-eq">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} style={{ animationDelay: `${i * 90}ms` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="board-now">
            <div className="board-now-title">El escenario está libre — ¡anímate!</div>
          </div>
        )}
      </div>

      <div className="board-queue">
        <div className="board-queue-header">
          <h1>La Lista</h1>
          <span>{data?.venueName ?? '…'}</span>
        </div>
        {error && <div className="msg-error">{error}</div>}
        <div className="board-rows">
          {upcoming.length === 0 ? (
            <p className="empty-state">Nadie en la cola todavía.</p>
          ) : (
            upcoming.map((entry, i) => (
              <div className="board-row" key={entry.id}>
                <span className="board-row-pos">{i + 1}</span>
                <div className="board-row-text">
                  <div className="board-row-name">
                    Mesa {entry.tableId}
                    {entry.mode !== 'SOLO' && (
                      <span className={`board-row-mode ${entry.mode === 'BATTLE' ? 'battle' : 'duo'}`}>
                        {entry.mode === 'BATTLE' ? 'BATTLE' : 'DÚO'}
                      </span>
                    )}
                  </div>
                  <div className="board-row-song">{entry.title}</div>
                </div>
                <span className="board-row-eta">{i === 0 ? 'SIGUIENTE' : ''}</span>
              </div>
            ))
          )}
        </div>
        <div className="board-cta">
          Escanea el QR de tu mesa para unirte · <span className="board-cta-brand">karabol.app</span>
        </div>
      </div>
    </div>
  );
}
