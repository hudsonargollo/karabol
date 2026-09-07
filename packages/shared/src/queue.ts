export type QueueEntryStatus = 'PENDING' | 'PLAYING' | 'COMPLETED' | 'SKIPPED';
export type PerformanceMode = 'SOLO' | 'DUO' | 'BATTLE';

export interface QueueEntry {
  id: string;
  venueId: string;
  tableId: string;
  songId: string;
  youtubeVideoId: string;
  title: string;
  requestedBy: string;
  status: QueueEntryStatus;
  mode: PerformanceMode;
  position: number;
  createdAt: string;
}

export interface TableBlock {
  tableId: string;
  entryIds: string[];
  maxConsecutive: number;
  sungInBlock: number;
}

/** 3.3 Dynamic Density-Based Queue Algorithm */
export function resolveConsecutiveLimit(activeTableCount: number): number {
  return activeTableCount > 1 ? 2 : 3;
}
