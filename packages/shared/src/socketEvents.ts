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

  // 3.4 Peer voting -> server -> everyone in the venue room
  /** A vote landed; payload carries the running tally for the live meter. */
  VOTE_UPDATE: 'vote:update',
  /** Voting closed for a performance; payload carries the final tally + reward. */
  VOTE_FINAL: 'vote:final',
  /** Voting just opened — clients should show the ballot for this entry. */
  VOTE_OPEN: 'vote:open',

  // Rewards
  REWARD_ISSUED: 'reward:issued',
} as const;

export type SocketEvent = (typeof SocketEvent)[keyof typeof SocketEvent];
