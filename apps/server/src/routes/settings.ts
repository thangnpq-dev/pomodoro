import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middlewares/auth';
import type { AlarmSound, UserSettings } from '@pomodoro/shared';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

const settingsSchema = z.object({
  pomodoroDuration: z.number().int().min(60).max(7200).optional(),
  shortBreakDuration: z.number().int().min(60).max(3600).optional(),
  longBreakDuration: z.number().int().min(60).max(5400).optional(),
  longBreakInterval: z.number().int().min(2).max(12).optional(),
  autoStartBreaks: z.boolean().optional(),
  autoStartPomodoros: z.boolean().optional(),
  alarmSound: z.enum(['bell', 'digital', 'chime']).optional(),
  alarmVolume: z.number().int().min(0).max(100).optional(),
  darkMode: z.boolean().optional(),
});

export const formatSettings = (dbSettings: {
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  alarmSound: string;
  alarmVolume: number;
  darkMode: boolean;
}): UserSettings => ({
  pomodoroDuration: dbSettings.pomodoroDuration,
  shortBreakDuration: dbSettings.shortBreakDuration,
  longBreakDuration: dbSettings.longBreakDuration,
  longBreakInterval: dbSettings.longBreakInterval,
  autoStartBreaks: dbSettings.autoStartBreaks,
  autoStartPomodoros: dbSettings.autoStartPomodoros,
  alarmSound: (dbSettings.alarmSound as AlarmSound) || 'bell',
  alarmVolume: dbSettings.alarmVolume,
  darkMode: dbSettings.darkMode,
});

settingsRouter.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    res.json(formatSettings(settings));
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Không thể tải cấu hình.' });
  }
});

settingsRouter.put('/', async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Cấu hình không hợp lệ.' });
      return;
    }

    const userId = req.userId!;
    const updated = await prisma.userSettings.upsert({
      where: { userId },
      update: parsed.data,
      create: {
        userId,
        ...parsed.data,
      },
    });

    res.json(formatSettings(updated));
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Không thể cập nhật cấu hình.' });
  }
});
