import { Router } from 'express';
import {
  cambiarPasswordHandler,
  desvincularDispositivoHandler,
  consultarAvisosHandler,
  estadoCuentaMensualHandler,
  estadoCuentaHistoricoHandler,
  resumenMovimientosHandler,
  buscarCreditoHandler,
} from '../controllers/infonavitController';
import { authenticateToken } from '../middleware/auth';
import { userRateLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validation';
import {
  cambiarPasswordSchema,
  desvincularDispositivoSchema,
  consultarAvisosSchema,
  estadoMensualSchema,
  estadoHistoricoSchema,
  resumenMovimientosSchema,
  buscarCreditoSchema,
} from '../utils/validators';

const router = Router();

// Todas las rutas requieren autenticación y rate limiting
router.use(authenticateToken);
router.use(userRateLimiter);

// 1. Cambiar contraseña
router.post('/cambiar-password', validate(cambiarPasswordSchema), cambiarPasswordHandler);

// 2. Desvincular dispositivo
router.post(
  '/desvincular-dispositivo',
  validate(desvincularDispositivoSchema),
  desvincularDispositivoHandler
);

// 3. Consultar avisos
router.post('/consultar-avisos', validate(consultarAvisosSchema), consultarAvisosHandler);

// 4. Estado de cuenta mensual
router.post('/estado-mensual', validate(estadoMensualSchema), estadoCuentaMensualHandler);

// 5. Estado de cuenta histórico
router.post('/estado-historico', validate(estadoHistoricoSchema), estadoCuentaHistoricoHandler);

// 6. Resumen de movimientos
router.post('/resumen-movimientos', validate(resumenMovimientosSchema), resumenMovimientosHandler);

// 7. Buscar crédito por NSS
router.post('/buscar-credito', validate(buscarCreditoSchema), buscarCreditoHandler);

export default router;
