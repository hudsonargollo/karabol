import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socket) return socket;
  socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:4000', {
    auth: { token },
  });
  return socket;
}
