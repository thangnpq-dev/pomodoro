import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, signToken, type AuthenticatedRequest } from '../middlewares/auth';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  name: z.string().min(1, 'Vui lòng nhập tên hiển thị'),
});

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Thiếu Google ID Token'),
});

interface GoogleTokenInfo {
  sub: string;
  email: string;
  email_verified?: string;
  name?: string;
  picture?: string;
  aud: string;
}

const formatUser = (user: {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl ?? undefined,
  createdAt: user.createdAt.toISOString(),
});

// 1-Click Google OAuth2 Sign-In / Sign-Up
authRouter.post('/google', async (req, res) => {
  try {
    const parsed = googleAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dữ liệu xác thực Google không hợp lệ.' });
      return;
    }

    const { credential } = parsed.data;

    // Verify ID token via Google's official tokeninfo endpoint
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );

    if (!googleRes.ok) {
      res.status(401).json({ error: 'Token Google không hợp lệ hoặc đã hết hạn.' });
      return;
    }

    const payload = (await googleRes.json()) as GoogleTokenInfo;

    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && payload.aud !== expectedClientId) {
      res.status(401).json({ error: 'Google Client ID không khớp với cấu hình máy chủ.' });
      return;
    }

    if (!payload.email || !payload.sub) {
      res.status(400).json({ error: 'Không lấy được thông tin email từ tài khoản Google.' });
      return;
    }

    const normalizedEmail = payload.email.toLowerCase().trim();
    const displayName = payload.name?.trim() || normalizedEmail.split('@')[0];

    // Find user by googleId or existing email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: payload.sub }, { email: normalizedEmail }],
      },
    });

    if (!user) {
      // Auto-register new user with default settings
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          googleId: payload.sub,
          name: displayName,
          avatarUrl: payload.picture ?? null,
          settings: {
            create: {},
          },
        },
      });
    } else if (!user.googleId || (payload.picture && user.avatarUrl !== payload.picture)) {
      // Link existing email account with Google ID & avatar
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          avatarUrl: payload.picture ?? user.avatarUrl,
        },
      });
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Google Auth error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi xác thực với Google.' });
  }
});

authRouter.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' });
      return;
    }

    const { email, password, name } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      res.status(409).json({ error: 'Email này đã được đăng ký.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        settings: {
          create: {},
        },
      },
    });

    const token = signToken(user.id);
    res.status(201).json({
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng ký tài khoản.' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' });
      return;
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordHash) {
      res.status(401).json({
        error:
          user && user.googleId
            ? 'Tài khoản này được tạo bằng Google. Vui lòng chọn "Tiếp tục với Google".'
            : 'Email hoặc mật khẩu không chính xác.',
      });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
      return;
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng nhập.' });
  }
});

authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'Không tìm thấy người dùng.' });
      return;
    }

    res.json(formatUser(user));
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
});
