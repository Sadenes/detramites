import { Router } from 'express';
import { login, logout, refreshToken } from '../controllers/authController';
import { validate } from '../middleware/validation';
import { loginSchema } from '../utils/validators';
import { strictRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', strictRateLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);

export default router;
