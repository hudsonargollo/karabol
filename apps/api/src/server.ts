import { createServer } from 'node:http';
import { app } from './app.js';
import { env } from './config/env.js';
import { initSockets } from './sockets/index.js';

const httpServer = createServer(app);
initSockets(httpServer);

httpServer.listen(env.port, () => {
  console.log(`[api] listening on :${env.port} (${env.nodeEnv})`);
});
