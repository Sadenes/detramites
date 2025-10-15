import { Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../types';
import prisma from '../utils/prisma';
import { UserRole } from '@prisma/client';
import { logAudit } from '../services/auditService';
import { assignCredits, canDistributorAssignCredits } from '../services/creditService';

// Listar todos los usuarios (solo superadmin)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        credits: true,
        canCreateUsers: true,
        distributorId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios',
    });
  }
};

// Obtener usuarios del distribuidor
export const getMyUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const users = await prisma.user.findMany({
      where: { distributorId: req.user.id },
      select: {
        id: true,
        username: true,
        role: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios',
    });
  }
};

// Crear superadmin secundario (solo master)
export const createSuperadminSecondary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validar campos requeridos
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username y password son requeridos',
      });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({
        success: false,
        error: 'Username debe tener al menos 3 caracteres',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password debe tener al menos 6 caracteres',
      });
      return;
    }

    // Verificar si ya existe un superadmin secundario
    const existingSuperadmin = await prisma.user.findFirst({
      where: { role: UserRole.SUPERADMIN_SECONDARY },
    });

    if (existingSuperadmin) {
      res.status(400).json({
        success: false,
        error: 'Ya existe un superadmin secundario',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: UserRole.SUPERADMIN_SECONDARY,
        credits: 0,
      },
      select: {
        id: true,
        username: true,
        role: true,
        credits: true,
        createdAt: true,
      },
    });

    await logAudit('USER_CREATED', req.user?.id, { newUserId: user.id, role: user.role }, req.ip);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({
        success: false,
        error: 'El nombre de usuario ya existe',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error al crear superadmin secundario',
    });
  }
};

// Crear distribuidor (solo superadmin)
export const createDistributor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password, canCreateUsers } = req.body;

    // Validar campos requeridos
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username y password son requeridos',
      });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({
        success: false,
        error: 'Username debe tener al menos 3 caracteres',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password debe tener al menos 6 caracteres',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: UserRole.DISTRIBUTOR,
        credits: 0,
        canCreateUsers: canCreateUsers !== undefined ? canCreateUsers : true,
      },
      select: {
        id: true,
        username: true,
        role: true,
        credits: true,
        canCreateUsers: true,
        createdAt: true,
      },
    });

    await logAudit('USER_CREATED', req.user?.id, { newUserId: user.id, role: user.role }, req.ip);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({
        success: false,
        error: 'El nombre de usuario ya existe',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error al crear distribuidor',
    });
  }
};

// Crear usuario final
export const createFinalUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    // Validar campos requeridos
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username y password son requeridos',
      });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({
        success: false,
        error: 'Username debe tener al menos 3 caracteres',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password debe tener al menos 6 caracteres',
      });
      return;
    }

    // Verificar si el distribuidor tiene permisos para crear usuarios
    if (req.user.role === UserRole.DISTRIBUTOR && !req.user.canCreateUsers) {
      res.status(403).json({
        success: false,
        error: 'No tiene permisos para crear usuarios',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: UserRole.FINAL_USER,
        credits: 0,
        distributorId: req.user.role === UserRole.DISTRIBUTOR ? req.user.id : undefined,
      },
      select: {
        id: true,
        username: true,
        role: true,
        credits: true,
        distributorId: true,
        createdAt: true,
      },
    });

    await logAudit('USER_CREATED', req.user.id, { newUserId: user.id, role: user.role }, req.ip);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({
        success: false,
        error: 'El nombre de usuario ya existe',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error al crear usuario final',
    });
  }
};

// Eliminar usuario
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    // Verificar que el usuario a eliminar existe
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }

    // Superadmin secundario no puede eliminar superadmins
    if (
      req.user.role === UserRole.SUPERADMIN_SECONDARY &&
      (targetUser.role === UserRole.SUPERADMIN_MASTER ||
        targetUser.role === UserRole.SUPERADMIN_SECONDARY)
    ) {
      res.status(403).json({
        success: false,
        error: 'No puede eliminar superadmins',
      });
      return;
    }

    // No se puede eliminar a sí mismo
    if (targetUser.id === req.user.id) {
      res.status(400).json({
        success: false,
        error: 'No puede eliminarse a sí mismo',
      });
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    await logAudit(
      'USER_DELETED',
      req.user.id,
      { deletedUserId: id, deletedUsername: targetUser.username },
      req.ip
    );

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario',
    });
  }
};

// Asignar créditos
export const assignCreditsToUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, amount } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    // Verificar que el usuario objetivo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }

    // Si es distribuidor, verificar que tiene suficientes créditos
    if (req.user.role === UserRole.DISTRIBUTOR) {
      const canAssign = await canDistributorAssignCredits(req.user.id, amount);

      if (!canAssign) {
        res.status(400).json({
          success: false,
          error: 'No tiene suficientes créditos disponibles',
        });
        return;
      }

      // Verificar que el usuario pertenece al distribuidor
      if (targetUser.distributorId !== req.user.id) {
        res.status(403).json({
          success: false,
          error: 'No puede asignar créditos a este usuario',
        });
        return;
      }
    }

    await assignCredits(userId, amount, `Créditos asignados por ${req.user.username}`);

    await logAudit('CREDITS_ASSIGNED', req.user.id, { targetUserId: userId, amount }, req.ip);

    res.json({
      success: true,
      message: 'Créditos asignados exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al asignar créditos',
    });
  }
};

// Cambiar contraseña
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    // Verificar contraseña actual
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Contraseña actual incorrecta',
      });
      return;
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    await logAudit('PASSWORD_CHANGED', req.user.id, {}, req.ip);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al cambiar contraseña',
    });
  }
};
