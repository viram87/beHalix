import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.', code: 'UNAUTHORIZED' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.', code: 'UNAUTHORIZED' });
  }
};

/** Sets req.user when token is valid; does not fail when missing/invalid (for public endpoints). */
export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return next();
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
  } catch {
    // invalid token – treat as unauthenticated
  }
  next();
};
