import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthenticatedRequest } from '../middlewares/auth';
import type { Task } from '@pomodoro/shared';

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

export const formatTask = (t: {
  id: string;
  title: string;
  note: string | null;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}): Task => ({
  id: t.id,
  title: t.title,
  note: t.note ?? undefined,
  estimatedPomodoros: t.estimatedPomodoros,
  completedPomodoros: t.completedPomodoros,
  isCompleted: t.isCompleted,
  orderIndex: t.orderIndex,
  createdAt: t.createdAt.toISOString(),
  updatedAt: t.updatedAt.toISOString(),
});

const createTaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  note: z.string().optional(),
  estimatedPomodoros: z.number().int().min(1).default(1),
  orderIndex: z.number().int().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  note: z.string().nullable().optional(),
  estimatedPomodoros: z.number().int().min(1).optional(),
  completedPomodoros: z.number().int().min(0).optional(),
  isCompleted: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
});

tasksRouter.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId! },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(tasks.map(formatTask));
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Không thể tải danh sách công việc.' });
  }
});

tasksRouter.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dữ liệu công việc không hợp lệ.' });
      return;
    }

    const { id, title, note, estimatedPomodoros, orderIndex } = parsed.data;
    const task = await prisma.task.create({
      data: {
        ...(id ? { id } : {}),
        userId: req.userId!,
        title: title.trim(),
        note: note?.trim() || null,
        estimatedPomodoros,
        orderIndex: orderIndex ?? 0,
      },
    });

    res.status(201).json(formatTask(task));
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Không thể tạo công việc.' });
  }
});

tasksRouter.patch('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dữ liệu cập nhật không hợp lệ.' });
      return;
    }

    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!existing) {
      res.status(404).json({ error: 'Không tìm thấy công việc.' });
      return;
    }

    const updated = await prisma.task.update({
      where: { id: existing.id },
      data: parsed.data,
    });

    res.json(formatTask(updated));
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Không thể cập nhật công việc.' });
  }
});

tasksRouter.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!existing) {
      res.status(404).json({ error: 'Không tìm thấy công việc.' });
      return;
    }

    await prisma.task.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Không thể xóa công việc.' });
  }
});
