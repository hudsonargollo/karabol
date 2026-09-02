import type { Server } from 'socket.io';

let ioInstance: Server | null = null;

export function setIo(io: Server): void {
  ioInstance = io;
}

export function getIo(): Server {
  if (!ioInstance) throw new Error('Socket.io server not initialized yet');
  return ioInstance;
}

export const venueRoom = (venueId: string) => `venue:${venueId}`;
export const tableRoom = (venueId: string, tableId: string) => `venue:${venueId}:table:${tableId}`;
