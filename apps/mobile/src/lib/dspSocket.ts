import { DSP_WS_URL } from './config';

export interface DspSocketHandlers {
  onTick?: (value: number) => void;
  onFinal?: (value: number) => void;
  onError?: (err: unknown) => void;
}

/**
 * 3.4 DSP Vocal Scoring — streams mic PCM chunks to the Python DSP service's
 * /ws/score/{queueEntryId} endpoint and relays live/final score updates.
 * See apps/dsp-service/app/main.py for the wire format this speaks to.
 */
export class DspSocket {
  private ws: WebSocket;
  private elapsedSeconds = 0;

  constructor(queueEntryId: string, venueId: string, handlers: DspSocketHandlers) {
    this.ws = new WebSocket(`${DSP_WS_URL}/ws/score/${queueEntryId}?venue_id=${encodeURIComponent(venueId)}`);

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as { type: string; value: number };
        if (message.type === 'tick') handlers.onTick?.(message.value);
        if (message.type === 'final') handlers.onFinal?.(message.value);
      } catch (err) {
        handlers.onError?.(err);
      }
    };
    this.ws.onerror = (err) => handlers.onError?.(err);
  }

  private waitForOpen(): Promise<void> {
    if (this.ws.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
    });
  }

  /** Call once per audio chunk (~200-500ms) captured from the mic. */
  async sendChunk(samples: Float32Array, chunkDurationSeconds: number): Promise<void> {
    await this.waitForOpen();
    this.ws.send(JSON.stringify({ t: this.elapsedSeconds, samples: Array.from(samples) }));
    this.elapsedSeconds += chunkDurationSeconds;
  }

  end(): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'end' }));
    }
    this.ws.close();
  }
}
