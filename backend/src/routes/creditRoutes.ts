import { Router } from 'express';
import { getBalance, getHistory } from '../controllers/creditController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/balance', getBalance);
router.get('/history', getHistory);

export default router;
