import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

const getJwtSecret = () => process.env.JWT_SECRET || 'pomofocus-super-secret-jwt-key-2026';

export const signToken = (userId: string): string => {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '30d' });
};

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
};
