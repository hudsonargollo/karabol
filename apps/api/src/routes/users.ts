import { Router } from 'express';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

export const usersRouter = Router();

// Profile/Home stats — real, computed from Score + QueueEntry. No battles
// count here: there's no Battle model yet (BattleScreen is still a fixed
// local demo), so that stat stays a dash on the client rather than being
// invented.
usersRouter.get('/me/stats', requireAuth, async (req, res) => {
  const userId = req.auth!.userId;

  const [songsCompleted, scoreAgg] = await Promise.all([
    prisma.queueEntry.count({ where: { requestedById: userId, status: 'COMPLETED' } }),
    prisma.score.aggregate({ where: { userId }, _avg: { value: true } }),
  ]);

  return res.json({
    songsCompleted,
    averageScore: scoreAgg._avg.value !== null ? Math.round(scoreAgg._avg.value * 10) / 10 : null,
  });
});
