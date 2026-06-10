import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateMeSchema } from '../validators/user.schema.js';

const router = Router();

router.get('/:username', userController.getPublicProfile);
router.patch('/me', authMiddleware, validate(updateMeSchema), userController.updateMe);

export default router;
