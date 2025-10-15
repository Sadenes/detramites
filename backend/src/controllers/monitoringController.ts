import { Response } from 'express';
import { AuthRequest } from '../types';
import {
  getActiveSessions,
  getUserSessions,
  closeSession,
  closeAllUserSessions,
  getFailedLoginAttempts,
  getUserFailedAttempts,
  getIPFailedAttempts,
} from '../services/monitoringService';

// Obtener todas las sesiones activas (solo superadmin)
export const getAllActiveSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await getActiveSessions();

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener sesiones activas',
    });
  }
};

// Obtener sesiones de un usuario específico
export const getUserSessionsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    // Solo superadmin o el mismo usuario pueden ver sus sesiones
    if (req.user.id !== userId && req.user.role !== 'SUPERADMIN_MASTER' && req.user.role !== 'SUPERADMIN_SECONDARY') {
      res.status(403).json({
        success: false,
        error: 'No autorizado',
      });
      return;
    }

    const sessions = await getUserSessions(userId);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener sesiones del usuario',
    });
  }
};

// Cerrar una sesión específica
export const closeSessionHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token no proporcionado',
      });
      return;
    }

    await closeSession(token);

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al cerrar sesión',
    });
  }
};

// Cerrar todas las sesiones de un usuario
export const closeAllUserSessionsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    // Solo superadmin puede cerrar sesiones de otros usuarios
    if (req.user.id !== userId && req.user.role !== 'SUPERADMIN_MASTER' && req.user.role !== 'SUPERADMIN_SECONDARY') {
      res.status(403).json({
        success: false,
        error: 'No autorizado',
      });
      return;
    }

    await closeAllUserSessions(userId);

    res.json({
      success: true,
      message: 'Todas las sesiones cerradas exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al cerrar sesiones',
    });
  }
};

// Obtener intentos de login fallidos (solo superadmin)
export const getFailedLoginAttemptsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const attempts = await getFailedLoginAttempts(limit);

    res.json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener intentos fallidos',
    });
  }
};

// Obtener intentos fallidos de un usuario
export const getUserFailedAttemptsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const attempts = await getUserFailedAttempts(username, limit);

    res.json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener intentos fallidos del usuario',
    });
  }
};

// Obtener intentos fallidos desde una IP
export const getIPFailedAttemptsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ip } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const attempts = await getIPFailedAttempts(ip, limit);

    res.json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener intentos fallidos de la IP',
    });
  }
};
