import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middlewares/auth';

export const statsRouter = Router();

statsRouter.use(requireAuth);

statsRouter.get('/summary', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const fromQuery = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined;
    const toQuery = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined;

    const sessions = await prisma.pomodoroSession.findMany({
      where: {
        userId,
        mode: 'POMODORO',
        ...(fromQuery || toQuery
          ? {
              endedAt: {
                ...(fromQuery ? { gte: fromQuery } : {}),
                ...(toQuery ? { lte: toQuery } : {}),
              },
            }
          : {}),
      },
      orderBy: { endedAt: 'desc' },
    });

    const totalFocusSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    const completedCount = sessions.filter((s) => s.isCompleted).length;

    res.json({
      totalFocusSeconds,
      totalFocusMinutes: Math.round(totalFocusSeconds / 60),
      completedSessions: completedCount,
      totalSessions: sessions.length,
    });
  } catch (err) {
    console.error('Stats summary error:', err);
    res.status(500).json({ error: 'Không thể tải thống kê.' });
  }
});
