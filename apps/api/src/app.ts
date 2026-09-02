import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { tablesRouter } from './routes/tables.js';
import { queueRouter } from './routes/queue.js';
import { walletRouter } from './routes/wallet.js';
import { scoresRouter } from './routes/scores.js';

export const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRouter);
app.use('/tables', tablesRouter);
app.use('/queue', queueRouter);
app.use('/wallet', walletRouter);
app.use('/scores', scoresRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
