import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { store } from '../models/store';
import { IUser, UserRole } from '../models/types';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication token missing or invalid',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; role: string };

    const user = await store.users.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User belonging to this token no longer exists',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`,
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
};
