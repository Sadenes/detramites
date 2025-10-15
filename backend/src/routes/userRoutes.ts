import { Router } from 'express';
import {
  getAllUsers,
  getMyUsers,
  createSuperadminSecondary,
  createDistributor,
  createFinalUser,
  deleteUser,
  assignCreditsToUser,
  changePassword,
} from '../controllers/userController';
import {
  authenticateToken,
  requireMasterAdmin,
  requireSuperadmin,
  requireRole,
  canManageUser,
} from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createUserSchema, assignCreditsSchema } from '../utils/validators';
import { UserRole } from '@prisma/client';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Listar todos los usuarios (solo superadmin)
router.get('/', requireSuperadmin, getAllUsers);

// Obtener mis usuarios (distribuidor)
router.get('/my-users', requireRole(UserRole.DISTRIBUTOR), getMyUsers);

// Crear superadmin secundario (solo master)
router.post('/superadmin-secondary', requireMasterAdmin, createSuperadminSecondary);

// Crear distribuidor (solo superadmin)
router.post('/distributor', requireSuperadmin, createDistributor);

// Crear usuario final (superadmin o distribuidor)
router.post(
  '/final-user',
  requireRole(UserRole.SUPERADMIN_MASTER, UserRole.SUPERADMIN_SECONDARY, UserRole.DISTRIBUTOR),
  createFinalUser
);

// Eliminar usuario
router.delete('/:id', canManageUser, deleteUser);

// Asignar créditos
router.post('/assign-credits', validate(assignCreditsSchema), assignCreditsToUser);

// Cambiar contraseña
router.post('/change-password', changePassword);

export default router;
