import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'edutrack_super_secure_academic_jwt_secret_2026';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  name: string;
}

export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if ((req as any).cookies && (req as any).cookies.token) {
    token = (req as any).cookies.token;
  }

  if (!token) {
    (req as any).user = undefined;
    return next();
  }

  const decoded = verifyToken(token);
  if (decoded) {
    (req as any).user = decoded;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

export function requireRole(allowedRoles: Array<'student' | 'faculty' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of [${allowedRoles.join(', ')}] role.`
      });
    }
    next();
  };
}
