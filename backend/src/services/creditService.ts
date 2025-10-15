import prisma from '../utils/prisma';
import { TransactionType, UserRole } from '@prisma/client';

export const assignCredits = async (
  userId: string,
  amount: number,
  description?: string
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    // Incrementar créditos del usuario
    await tx.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount,
        },
      },
    });

    // Crear registro de transacción
    await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        type: TransactionType.ASSIGNED,
        description: description || 'Créditos asignados',
      },
    });
  });
};

export const consumeCredits = async (
  userId: string,
  amount: number,
  description?: string
): Promise<boolean> => {
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true, role: true },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Superadmins tienen créditos infinitos, no verificar ni decrementar
      const isSuperadmin = user.role === UserRole.SUPERADMIN_MASTER || user.role === UserRole.SUPERADMIN_SECONDARY;

      if (!isSuperadmin) {
        if (user.credits < amount) {
          throw new Error('Créditos insuficientes');
        }

        await tx.user.update({
          where: { id: userId },
          data: {
            credits: {
              decrement: amount,
            },
          },
        });
      }

      // Registrar transacción para todos (incluso superadmins, para auditoría)
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: TransactionType.CONSUMED,
          description: description || 'Créditos consumidos',
        },
      });
    });

    return true;
  } catch (error) {
    return false;
  }
};

export const refundCredits = async (
  userId: string,
  amount: number,
  description?: string
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount,
        },
      },
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        type: TransactionType.REFUNDED,
        description: description || 'Créditos devueltos',
      },
    });
  });
};

export const getUserCredits = async (userId: string): Promise<number> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  return user?.credits || 0;
};

export const getCreditHistory = async (userId: string) => {
  return await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

// Verificar si el distribuidor tiene suficientes créditos para asignar
export const canDistributorAssignCredits = async (
  distributorId: string,
  amount: number
): Promise<boolean> => {
  const distributor = await prisma.user.findUnique({
    where: { id: distributorId },
    select: { credits: true },
  });

  if (!distributor) return false;

  // Obtener créditos circulantes en su red
  const usersCredits = await prisma.user.aggregate({
    where: { distributorId },
    _sum: { credits: true },
  });

  const circulatingCredits = usersCredits._sum.credits || 0;
  const availableCredits = distributor.credits - circulatingCredits;

  return availableCredits >= amount;
};
