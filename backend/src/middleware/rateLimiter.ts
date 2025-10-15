import rateLimit from 'express-rate-limit';
import { AuthRequest } from '../types';
import { UserRole } from '@prisma/client';

// Rate limiter para usuarios finales (10 req/min)
export const userRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minuto
  max: async (req: AuthRequest) => {
    if (!req.user) return 10;

    // Distribuidores tienen límite mayor
    if (req.user.role === UserRole.DISTRIBUTOR) {
      return parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_DISTRIBUTOR || '50');
    }

    // Superadmins no tienen límite
    if (
      req.user.role === UserRole.SUPERADMIN_MASTER ||
      req.user.role === UserRole.SUPERADMIN_SECONDARY
    ) {
      return 1000;
    }

    // Usuarios finales: 10 req/min
    return parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_USER || '10');
  },
  message: {
    success: false,
    error: 'Demasiadas solicitudes. Por favor intente más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: AuthRequest) => {
    return req.user?.id || req.ip || 'unknown';
  },
});

// Rate limiter más estricto para endpoints sensibles
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: {
    success: false,
    error: 'Demasiados intentos. Por favor intente más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
