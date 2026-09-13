import { useEffect, useRef, useState } from 'react';
import stageWide from '../assets/stage-wide.webp';
import logo from '../assets/logo.webp';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const POLL_MS = 5000;
const YT_ORIGIN = 'https://www.youtube.com';

interface BoardEntry {
  id: string;
  tableId: string;
  title: string;
  youtubeVideoId: string;
  status: 'PENDING' | 'PLAYING' | 'COMPLETED' | 'SKIPPED';
  mode: 'SOLO' | 'DUO' | 'BATTLE';
  position: number;
}

interface BoardVoting {
  queueEntryId: string;
  title: string;
  tableId: string;
  closesAt: string | null;
  tally: { value: number; voteCount: number; averageVote: number | null; distribution: number[] };
}

interface BoardData {
  venueName: string;
  entries: BoardEntry[];
  voting: BoardVoting | null;
}

// IFrame Player API error codes that mean "this video will not play here".
const YT_FATAL_ERRORS: Record<number, string> = {
  2: 'ID de video inválido',
  5: 'El reproductor no pudo cargar el video',
  100: 'El video ya no existe',
  101: 'El dueño no permite reproducirlo fuera de YouTube',
  150: 'El dueño no permite reproducirlo fuera de YouTube',
};

function ytCommand(win: Window | null | undefined, func: string, args: unknown[] = []) {
  win?.postMessage(JSON.stringify({ event: 'command', func, args }), YT_ORIGIN);
}

// 09 Bar TV / Tablet — an unauthenticated, ambient display for the venue's
// own screen: shows what's playing and who's next. Reads a public,
// read-only endpoint (GET /queue/:venueId/board) instead of the staff
// dashboard's authenticated one, since there's no login session on a TV.
// Polls rather than opening a socket — a few seconds of staleness doesn't
// matter for a passive display, and it keeps this page's auth surface at
// zero.
//
// The now-playing track is a real embedded YouTube player (via the
// official iframe embed — never a downloaded/rehosted copy of the video).
// Branding (logo, "now singing" strip, eq bars) lives in the chrome around
// the player, not composited on top of the video itself, per YouTube's
// embed terms. Starts muted so autoplay isn't blocked by the browser; a
// single tap unmutes via the IFrame Player API postMessage protocol and
// stays unmuted across song changes for the rest of this kiosk session.
export function BoardPage({ venueId }: { venueId: string }) {
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;
  const playerRef = useRef<HTMLIFrameElement | null>(null);

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

  // The embed reports errors over postMessage once `listening` is sent (the
  // onLoad handler below does that). Videos are verified playable at enqueue
  // time, so this only fires for the rare one that changed status since —
  // the board can't skip (it has no login), so it says so loudly and staff do.
  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (ev.origin !== YT_ORIGIN || typeof ev.data !== 'string') return;
      try {
        const msg = JSON.parse(ev.data) as { event?: string; info?: unknown };
        if (msg.event === 'onError' && typeof msg.info === 'number') {
          setPlaybackError(YT_FATAL_ERRORS[msg.info] ?? `Error ${msg.info} del reproductor`);
        }
      } catch {
        /* not a player message */
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!venueId) {
    return (
      <div className="board-error">
        Falta el venue. Usa la URL <code>/board?venue=&lt;venueId&gt;</code>.
      </div>
    );
  }

  const nowPlaying = data?.entries.find((e) => e.status === 'PLAYING') ?? null;
  const upcoming = data?.entries.filter((e) => e.status === 'PENDING') ?? [];

  function enableSound() {
    setSoundOn(true);
    const win = playerRef.current?.contentWindow;
    ytCommand(win, 'unMute');
    ytCommand(win, 'setVolume', [100]);
  }

  function onPlayerLoad() {
    setPlaybackError(null);
    const win = playerRef.current?.contentWindow;
    // Subscribe to player events (needed for onError above).
    win?.postMessage(JSON.stringify({ event: 'listening', id: 'board' }), YT_ORIGIN);
    // A fresh iframe (new song) always starts muted (see the URL below) —
    // if the venue already granted sound once this session, re-apply it
    // without asking again.
    if (soundOnRef.current) {
      ytCommand(win, 'unMute');
      ytCommand(win, 'setVolume', [100]);
    }
  }

  return (
    <div className="board">
      <div className="board-stage">
        <div className="board-video-wrap">
          {nowPlaying ? (
            <iframe
              key={nowPlaying.id}
              ref={playerRef}
              className="board-video"
              src={`https://www.youtube.com/embed/${nowPlaying.youtubeVideoId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
              title={nowPlaying.title}
              allow="autoplay; encrypted-media"
              allowFullScreen
              onLoad={onPlayerLoad}
            />
          ) : (
            <img src={stageWide} alt="" className="board-stage-img" />
          )}
          {nowPlaying && !soundOn && !playbackError && (
            <button className="board-sound-btn" onClick={enableSound}>
              🔊 Toca para activar el sonido
            </button>
          )}
          {nowPlaying && playbackError && (
            <div className="board-playback-error">
              <strong>Este video no se puede reproducir</strong>
              <span>{playbackError}</span>
              <span>Staff: salta esta canción desde el panel.</span>
            </div>
          )}
        </div>

        <div className="board-now">
          <img src={logo} alt="KARABOL" className="board-logo" />
          {nowPlaying ? (
            <>
              <div className="board-now-label">AHORA EN EL ESCENARIO</div>
              <div className="board-now-title">
                Mesa {nowPlaying.tableId} · &quot;{nowPlaying.title}&quot;
              </div>
              <div className="board-eq">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} style={{ animationDelay: `${i * 90}ms` }} />
                ))}
              </div>
              {data?.voting && data.voting.queueEntryId === nowPlaying.id && (
                <div className="board-votes">
                  <span className="board-votes-avg">
                    {data.voting.tally.averageVote != null ? `★ ${data.voting.tally.averageVote.toFixed(1)}` : '★ —'}
                  </span>
                  <span className="board-votes-count">
                    {data.voting.tally.voteCount === 0
                      ? '¡Vota desde tu celular!'
                      : `${data.voting.tally.voteCount} ${data.voting.tally.voteCount === 1 ? 'voto' : 'votos'} del público`}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="board-now-title">El escenario está libre — ¡anímate!</div>
          )}
        </div>
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
