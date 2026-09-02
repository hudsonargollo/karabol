// Shared Socket.io event names between the API, venue-panel, and mobile app.
export const SocketEvent = {
  // Patron -> server
  QUEUE_JOIN: 'queue:join',
  QUEUE_LEAVE: 'queue:leave',

  // Server -> venue panel / patrons in a venue room
  QUEUE_STATE: 'queue:state',
  NOW_PLAYING: 'queue:now_playing',

  // Venue -> server
  QUEUE_SKIP: 'queue:skip',
  QUEUE_PAUSE: 'queue:pause',
  QUEUE_REMOVE: 'queue:remove',

  // DSP -> server -> patron/venue
  SCORE_UPDATE: 'score:update',
  SCORE_FINAL: 'score:final',

  // Rewards
  REWARD_ISSUED: 'reward:issued',
} as const;

export type SocketEvent = (typeof SocketEvent)[keyof typeof SocketEvent];
