import { Response } from 'express';
import { AuthRequest } from '../types';
import { getUserCredits, getCreditHistory } from '../services/creditService';
import prisma from '../utils/prisma';
import { UserRole } from '@prisma/client';

export const getBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const balance = await getUserCredits(req.user.id);

    // Si es distribuidor, calcular créditos distribuidos y disponibles
    let distributed = 0;
    let available = balance;

    if (req.user.role === UserRole.DISTRIBUTOR) {
      const usersCredits = await prisma.user.aggregate({
        where: { distributorId: req.user.id },
        _sum: { credits: true },
      });

      distributed = usersCredits._sum.credits || 0;
      available = balance - distributed;
    }

    res.json({
      success: true,
      data: {
        balance,
        distributed,
        available,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener balance',
    });
  }
};

export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const history = await getCreditHistory(req.user.id);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial',
    });
  }
};
