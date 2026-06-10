import { authService } from '../services/auth.service.js';
import { catchAsync } from '../utils/errors.js';

export const authController = {
  register: catchAsync(async (req, res) => {
    res.status(201).json(await authService.register(req.body));
  }),
  login: catchAsync(async (req, res) => {
    res.json(await authService.login(req.body));
  }),
  logout: catchAsync(async (_req, res) => {
    res.json({ ok: true });
  })
};
