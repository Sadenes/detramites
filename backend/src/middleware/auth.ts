import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload } from '../types';
import prisma from '../utils/prisma';
import { UserRole } from '@prisma/client';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ success: false, error: 'Token no proporcionado' });
      return;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ success: false, error: 'Token inválido o expirado' });
  }
};

// Middleware para verificar roles
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'No tiene permisos para esta acción' });
      return;
    }

    next();
  };
};

// Middleware para verificar permisos de superadmin
export const requireSuperadmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }

  if (req.user.role !== UserRole.SUPERADMIN_MASTER && req.user.role !== UserRole.SUPERADMIN_SECONDARY) {
    res.status(403).json({ success: false, error: 'Requiere permisos de superadmin' });
    return;
  }

  next();
};

// Middleware para verificar si es superadmin master
export const requireMasterAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }

  if (req.user.role !== UserRole.SUPERADMIN_MASTER) {
    res.status(403).json({ success: false, error: 'Requiere permisos de superadmin master' });
    return;
  }

  next();
};

// Middleware para verificar si puede administrar un usuario específico
export const canManageUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const targetUserId = req.params.id || req.body.userId;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    // Superadmins pueden administrar a todos
    if (
      req.user.role === UserRole.SUPERADMIN_MASTER ||
      req.user.role === UserRole.SUPERADMIN_SECONDARY
    ) {
      next();
      return;
    }

    // Distribuidores solo pueden administrar sus propios usuarios
    if (req.user.role === UserRole.DISTRIBUTOR) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!targetUser || targetUser.distributorId !== req.user.id) {
        res.status(403).json({ success: false, error: 'No puede administrar este usuario' });
        return;
      }

      next();
      return;
    }

    res.status(403).json({ success: false, error: 'No tiene permisos' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al verificar permisos' });
  }
};
