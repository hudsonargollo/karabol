import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketEvent } from '@karaokebo/shared';
import { env } from '../config/env.js';
import { setIo, venueRoom } from './io.js';
import type { AuthPayload } from '../middleware/auth.js';

/**
 * Bi-directional WebSocket layer (PRD 4: Node.js + Socket.io) — patron
 * devices and the venue panel join a per-venue room and receive queue
 * state, now-playing, and live DSP score events pushed from Redis Pub/Sub.
 */
export function initSockets(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigin },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('missing auth token'));
    try {
      socket.data.auth = jwt.verify(token, env.jwtSecret) as AuthPayload;
      return next();
    } catch {
      return next(new Error('invalid auth token'));
    }
  });

  io.on('connection', (socket) => {
    const auth = socket.data.auth as AuthPayload;

    socket.on(SocketEvent.QUEUE_JOIN, (venueId: string) => {
      socket.join(venueRoom(venueId));
    });

    socket.on(SocketEvent.QUEUE_LEAVE, (venueId: string) => {
      socket.leave(venueRoom(venueId));
    });

    // Venue-only overrides — RBAC re-checked here since socket events bypass Express middleware.
    socket.on(SocketEvent.QUEUE_SKIP, (payload: { venueId: string; queueEntryId: string }) => {
      if (auth.role === 'PATRON') return;
      io.to(venueRoom(payload.venueId)).emit(SocketEvent.QUEUE_SKIP, payload);
    });
  });

  setIo(io);
  return io;
}
