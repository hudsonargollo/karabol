import { io, type Socket } from 'socket.io-client';
import { API_URL } from './config';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socket?.connected) return socket;
  socket = io(API_URL, { auth: { token } });
  return socket;
}
