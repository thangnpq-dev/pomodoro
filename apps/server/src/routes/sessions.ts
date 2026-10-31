import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middlewares/auth';
import { formatSettings } from './settings';
import { formatTask } from './tasks';
import type { PomodoroSession, TimerMode } from '@pomodoro/shared';

export const sessionsRouter = Router();

sessionsRouter.use(requireAuth);

export const formatSession = (s: {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  mode: string;
  durationSeconds: number;
  startedAt: Date;
  endedAt: Date;
  isCompleted: boolean;
}): PomodoroSession => ({
  id: s.id,
  taskId: s.taskId,
  taskTitle: s.taskTitle ?? undefined,
  mode: s.mode as TimerMode,
  durationSeconds: s.durationSeconds,
  startedAt: s.startedAt.toISOString(),
  endedAt: s.endedAt.toISOString(),
  isCompleted: s.isCompleted,
  synced: true,
});

const createSessionSchema = z.object({
  id: z.string().optional(),
  taskId: z.string().nullable().optional(),
  taskTitle: z.string().optional(),
  mode: z.enum(['POMODORO', 'SHORT_BREAK', 'LONG_BREAK']),
  durationSeconds: z.number().int().min(1),
  startedAt: z.string(),
  endedAt: z.string(),
  isCompleted: z.boolean().default(true),
});

const syncPayloadSchema = z.object({
  settings: z
    .object({
      pomodoroDuration: z.number().int().min(60).max(7200),
      shortBreakDuration: z.number().int().min(60).max(3600),
      longBreakDuration: z.number().int().min(60).max(5400),
      longBreakInterval: z.number().int().min(2).max(12),
      autoStartBreaks: z.boolean(),
      autoStartPomodoros: z.boolean(),
      alarmSound: z.enum(['bell', 'digital', 'chime']),
      alarmVolume: z.number().int().min(0).max(100),
      darkMode: z.boolean(),
    })
    .optional(),
  tasks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        note: z.string().optional(),
        estimatedPomodoros: z.number().int().min(1),
        completedPomodoros: z.number().int().min(0),
        isCompleted: z.boolean(),
        orderIndex: z.number().int(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      })
    )
    .default([]),
  sessions: z
    .array(
      z.object({
        id: z.string(),
        taskId: z.string().nullable().optional(),
        taskTitle: z.string().optional(),
        mode: z.enum(['POMODORO', 'SHORT_BREAK', 'LONG_BREAK']),
        durationSeconds: z.number().int().min(1),
        startedAt: z.string(),
        endedAt: z.string(),
        isCompleted: z.boolean(),
      })
    )
    .default([]),
});

sessionsRouter.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dữ liệu phiên Pomodoro không hợp lệ.' });
      return;
    }

    const userId = req.userId!;
    const data = parsed.data;

    // Verify if taskId belongs to user
    let validTaskId: string | null = null;
    if (data.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: data.taskId, userId },
      });
      if (task) {
        validTaskId = task.id;
      }
    }

    const session = await prisma.pomodoroSession.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        userId,
        taskId: validTaskId,
        taskTitle: data.taskTitle || null,
        mode: data.mode,
        durationSeconds: data.durationSeconds,
        startedAt: new Date(data.startedAt),
        endedAt: new Date(data.endedAt),
        isCompleted: data.isCompleted,
      },
    });

    if (validTaskId && data.mode === 'POMODORO' && data.isCompleted) {
      await prisma.task.update({
        where: { id: validTaskId },
        data: { completedPomodoros: { increment: 1 } },
      });
    }

    res.status(201).json(formatSession(session));
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Không thể lưu phiên Pomodoro.' });
  }
});

// Bulk Sync endpoint: Merges local tasks, sessions, and settings with PostgreSQL
sessionsRouter.post('/sync', async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = syncPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dữ liệu đồng bộ không hợp lệ.' });
      return;
    }

    const userId = req.userId!;
    const { settings, tasks, sessions } = parsed.data;

    // 1. Upsert Settings
    const dbSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: settings ? { ...settings } : {},
      create: {
        userId,
        ...(settings ? settings : {}),
      },
    });

    // 2. Merge Tasks (skip default welcome task if user already has cloud tasks)
    for (const t of tasks) {
      if (t.id === 'welcome-task-1') continue;

      const existingById = await prisma.task.findUnique({ where: { id: t.id } });
      if (!existingById) {
        await prisma.task.create({
          data: {
            id: t.id,
            userId,
            title: t.title,
            note: t.note ?? null,
            estimatedPomodoros: t.estimatedPomodoros,
            completedPomodoros: t.completedPomodoros,
            isCompleted: t.isCompleted,
            orderIndex: t.orderIndex,
          },
        });
      } else if (existingById.userId === userId) {
        await prisma.task.update({
          where: { id: t.id },
          data: {
            title: t.title,
            note: t.note ?? null,
            estimatedPomodoros: t.estimatedPomodoros,
            completedPomodoros: Math.max(existingById.completedPomodoros, t.completedPomodoros),
            isCompleted: t.isCompleted,
            orderIndex: t.orderIndex,
          },
        });
      }
    }

    // 3. Merge Sessions
    const userTaskIds = new Set(
      (await prisma.task.findMany({ where: { userId }, select: { id: true } })).map((t) => t.id)
    );

    for (const s of sessions) {
      const existingSession = await prisma.pomodoroSession.findUnique({ where: { id: s.id } });
      if (!existingSession) {
        await prisma.pomodoroSession.create({
          data: {
            id: s.id,
            userId,
            taskId: s.taskId && userTaskIds.has(s.taskId) ? s.taskId : null,
            taskTitle: s.taskTitle ?? null,
            mode: s.mode,
            durationSeconds: s.durationSeconds,
            startedAt: new Date(s.startedAt),
            endedAt: new Date(s.endedAt),
            isCompleted: s.isCompleted,
          },
        });
      }
    }

    // Return full merged state from DB
    const [allTasks, allSessions] = await Promise.all([
      prisma.task.findMany({
        where: { userId },
        orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.pomodoroSession.findMany({
        where: { userId },
        orderBy: { endedAt: 'desc' },
        take: 100,
      }),
    ]);

    res.json({
      settings: formatSettings(dbSettings),
      tasks: allTasks.map(formatTask),
      sessions: allSessions.map(formatSession),
    });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Không thể đồng bộ dữ liệu lên đám mây.' });
  }
});
