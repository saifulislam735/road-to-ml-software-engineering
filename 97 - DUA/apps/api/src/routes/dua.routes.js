import { Router } from 'express';
import { duaController } from '../controllers/dua.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { duaSendLimiter, reportLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { reportDuaSchema, sendDuaSchema } from '../validators/dua.schema.js';

const router = Router();

router.post('/send/:username', duaSendLimiter, validate(sendDuaSchema), duaController.send);
router.get('/inbox', authMiddleware, duaController.inbox);
router.patch('/:id/read', authMiddleware, duaController.markRead);
router.delete('/:id', authMiddleware, duaController.deleteOwn);
router.post('/:id/report', reportLimiter, validate(reportDuaSchema), duaController.report);

export default router;
