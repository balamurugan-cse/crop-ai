import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/env';
import { store } from '../models/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRole } from '../models/types';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['farmer', 'expert', 'admin']).default('farmer'),
  preferredLanguage: z.string().optional(),
  consent: z.object({
    dataCollection: z.boolean(),
    researchUse: z.boolean(),
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, preferredLanguage, consent } = req.body;

    const existingUser = await store.users.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'An account with this email address already exists',
        code: 'EMAIL_ALREADY_EXISTS',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await store.users.create({
      name,
      email,
      passwordHash,
      role: role as UserRole,
      preferredLanguage: preferredLanguage || 'en',
      consent: {
        dataCollection: consent.dataCollection,
        researchUse: consent.researchUse,
        timestamp: new Date().toISOString(),
      },
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    await store.auditLogs.create({
      actorId: user._id,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: user._id,
      outcome: 'success',
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        consent: user.consent,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await store.users.findByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    await store.auditLogs.create({
      actorId: user._id,
      actorRole: user.role,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user._id,
      outcome: 'success',
    });

    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        consent: user.consent,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  const user = req.user;
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      consent: user.consent,
    },
  });
};
