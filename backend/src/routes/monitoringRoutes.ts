import { Router } from 'express';
import {
  getAllActiveSessions,
  getUserSessionsHandler,
  closeSessionHandler,
  closeAllUserSessionsHandler,
  getFailedLoginAttemptsHandler,
  getUserFailedAttemptsHandler,
  getIPFailedAttemptsHandler,
} from '../controllers/monitoringController';
import { authenticateToken, requireSuperadmin } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de sesiones (solo superadmin)
router.get('/sessions', requireSuperadmin, getAllActiveSessions);
router.get('/sessions/user/:userId', getUserSessionsHandler);
router.post('/sessions/close', closeSessionHandler);
router.post('/sessions/close-all/:userId', closeAllUserSessionsHandler);

// Rutas de intentos fallidos (solo superadmin)
router.get('/failed-logins', requireSuperadmin, getFailedLoginAttemptsHandler);
router.get('/failed-logins/user/:username', requireSuperadmin, getUserFailedAttemptsHandler);
router.get('/failed-logins/ip/:ip', requireSuperadmin, getIPFailedAttemptsHandler);

export default router;
