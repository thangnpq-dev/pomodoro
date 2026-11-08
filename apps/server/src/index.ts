import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { settingsRouter } from './routes/settings';
import { tasksRouter } from './routes/tasks';
import { sessionsRouter } from './routes/sessions';
import { statsRouter } from './routes/stats';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(express.json());

// COOP header for Google OAuth popups
app.use((_req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/stats', statsRouter);

app.listen(PORT, () => {
  console.log(`🚀 PomoFocus API Server running on http://localhost:${PORT}`);
});
