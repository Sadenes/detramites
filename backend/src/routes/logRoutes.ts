import { Router } from 'express';
import { getAuditLog, getMyQueries } from '../controllers/logController';
import { authenticateToken, requireSuperadmin } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Logs de auditoría (solo superadmin)
router.get('/audit', requireSuperadmin, getAuditLog);

// Mis consultas (todos los usuarios autenticados)
router.get('/my-queries', getMyQueries);

export default router;
