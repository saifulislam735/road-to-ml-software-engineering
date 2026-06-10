import { authMiddleware } from './auth.middleware.js';

export function adminAuthMiddleware(req, res, next) {
  return authMiddleware(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: true, message: 'Admin access required' });
    }
    return next();
  });
}
