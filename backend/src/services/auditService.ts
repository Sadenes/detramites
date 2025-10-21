import prisma from '../utils/prisma';

export const logAudit = async (
  action: string,
  userId?: string,
  details?: any,
  ipAddress?: string
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        details,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

export const getAuditLogs = async (filters?: {
  userId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) => {
  const where: any = {};

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.action) {
    where.action = filters.action;
  }

  // Obtener logs de consultas API en lugar de audit logs
  const queries = await prisma.apiQuery.findMany({
    where: filters?.userId ? { userId: filters.userId } : {},
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
      createdAt: 'desc',
    },
    take: filters?.limit || 100,
    skip: filters?.offset || 0,
  });

  // Formatear las consultas para que coincidan con el formato esperado por el frontend
  return queries.map(query => ({
    id: query.id,
    userId: query.userId,
    api: 'INFONAVIT', // Por ahora solo tenemos INFONAVIT
    endpoint: query.endpoint,
    status: query.status === 'COMPLETED' ? 'success' : 'failed',
    responseTime: query.updatedAt ? `${Math.round((query.updatedAt.getTime() - query.createdAt.getTime()) / 1000)}s` : 'N/A',
    createdAt: query.createdAt,
    user: query.user,
  }));
};
