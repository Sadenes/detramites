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

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
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

  return logs;
};
