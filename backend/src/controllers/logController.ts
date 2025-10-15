import { Response } from 'express';
import { AuthRequest } from '../types';
import { getAuditLogs } from '../services/auditService';
import prisma from '../utils/prisma';
import { UserRole } from '@prisma/client';

export const getAuditLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const { action, limit, offset } = req.query;

    const logs = await getAuditLogs({
      action: action as string,
      limit: limit ? parseInt(limit as string) : 100,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener logs de auditoría',
    });
  }
};

export const getMyQueries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const { limit = '50', offset = '0' } = req.query;

    let queries;

    // Si es distribuidor, obtener consultas de sus usuarios también
    if (req.user.role === UserRole.DISTRIBUTOR) {
      queries = await prisma.apiQuery.findMany({
        where: {
          user: {
            OR: [{ id: req.user.id }, { distributorId: req.user.id }],
          },
        },
        include: {
          user: {
            select: {
              username: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      });
    } else {
      queries = await prisma.apiQuery.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      });
    }

    res.json({
      success: true,
      data: queries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial de consultas',
    });
  }
};
