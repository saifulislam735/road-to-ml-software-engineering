import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { banUserSchema, resolveReportSchema } from '../validators/admin.schema.js';

const router = Router();

router.use(adminAuthMiddleware);
router.get('/stats', adminController.stats);
router.get('/users', adminController.users);
router.get('/users/:id', adminController.user);
router.patch('/users/:id/ban', validate(banUserSchema), adminController.banUser);
router.patch('/users/:id/unban', adminController.unbanUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/duas', adminController.duas);
router.patch('/duas/:id/hide', adminController.hideDua);
router.patch('/duas/:id/unhide', adminController.unhideDua);
router.delete('/duas/:id', adminController.deleteDua);
router.get('/reports', adminController.reports);
router.patch('/reports/:id/resolve', validate(resolveReportSchema), adminController.resolveReport);
router.patch('/reports/:id/dismiss', adminController.dismissReport);

export default router;
