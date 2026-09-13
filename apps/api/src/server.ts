import { createServer } from 'node:http';
import { app } from './app.js';
import { env } from './config/env.js';
import { finalizeDueVotes } from './services/votingEngine.js';
import { initSockets } from './sockets/index.js';

const httpServer = createServer(app);
initSockets(httpServer);

httpServer.listen(env.port, async () => {
  console.log(`[api] listening on :${env.port} (${env.nodeEnv})`);

  // Vote windows close on an in-process timer; any that were mid-grace when
  // the previous process died get frozen here instead of dangling forever.
  const closed = await finalizeDueVotes().catch((err) => {
    console.error('[voting] startup sweep failed', err);
    return 0;
  });
  if (closed > 0) console.log(`[voting] finalized ${closed} vote window(s) left open by a previous run`);
});
