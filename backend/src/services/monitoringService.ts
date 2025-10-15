import prisma from '../utils/prisma';
import { addDays } from 'date-fns';

// Crear una nueva sesión
export const createSession = async (
  userId: string,
  token: string,
  deviceInfo: {
    deviceName?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    ipAddress: string;
    city?: string;
    country?: string;
  }
) => {
  const expiresAt = addDays(new Date(), 7); // Sesión expira en 7 días

  return await prisma.userSession.create({
    data: {
      userId,
      token,
      ...deviceInfo,
      expiresAt,
    },
  });
};

// Obtener todas las sesiones activas
export const getActiveSessions = async () => {
  return await prisma.userSession.findMany({
    where: {
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
    orderBy: {
      lastActivity: 'desc',
    },
  });
};

// Obtener sesiones de un usuario específico
export const getUserSessions = async (userId: string) => {
  return await prisma.userSession.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: {
      lastActivity: 'desc',
    },
  });
};

// Actualizar actividad de una sesión
export const updateSessionActivity = async (token: string) => {
  return await prisma.userSession.update({
    where: { token },
    data: {
      lastActivity: new Date(),
    },
  });
};

// Cerrar sesión
export const closeSession = async (token: string) => {
  return await prisma.userSession.update({
    where: { token },
    data: {
      isActive: false,
    },
  });
};

// Cerrar todas las sesiones de un usuario
export const closeAllUserSessions = async (userId: string) => {
  return await prisma.userSession.updateMany({
    where: {
      userId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });
};

// Limpiar sesiones expiradas
export const cleanExpiredSessions = async () => {
  return await prisma.userSession.updateMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });
};

// Registrar intento de login fallido
export const logFailedLogin = async (
  username: string,
  ipAddress: string,
  reason: string,
  userAgent?: string
) => {
  // Intentar encontrar el usuario para asociar el intento
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  return await prisma.failedLoginAttempt.create({
    data: {
      username,
      userId: user?.id,
      ipAddress,
      userAgent,
      reason,
    },
  });
};

// Obtener intentos de login fallidos recientes
export const getFailedLoginAttempts = async (limit: number = 50) => {
  return await prisma.failedLoginAttempt.findMany({
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
  });
};

// Obtener intentos fallidos de un usuario específico
export const getUserFailedAttempts = async (username: string, limit: number = 10) => {
  return await prisma.failedLoginAttempt.findMany({
    where: { username },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Obtener intentos fallidos desde una IP
export const getIPFailedAttempts = async (ipAddress: string, limit: number = 10) => {
  return await prisma.failedLoginAttempt.findMany({
    where: { ipAddress },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Verificar si una IP está bloqueada (más de 5 intentos en 15 minutos)
export const isIPBlocked = async (ipAddress: string): Promise<boolean> => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const attempts = await prisma.failedLoginAttempt.count({
    where: {
      ipAddress,
      createdAt: {
        gte: fifteenMinutesAgo,
      },
    },
  });

  return attempts >= 5;
};
