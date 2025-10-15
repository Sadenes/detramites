import { Response } from 'express';
import { AuthRequest } from '../types';
import { getUserCredits, getCreditHistory } from '../services/creditService';

export const getBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const balance = await getUserCredits(req.user.id);

    res.json({
      success: true,
      data: {
        balance,
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
