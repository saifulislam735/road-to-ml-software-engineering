import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginSchema, registerSchema } from '../validators/auth.schema.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authMiddleware, authController.logout);

export default router;
