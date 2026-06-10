import { userService } from '../services/user.service.js';
import { catchAsync } from '../utils/errors.js';

export const userController = {
  getPublicProfile: catchAsync(async (req, res) => {
    res.json(await userService.getPublicProfile(req.params.username));
  }),
  updateMe: catchAsync(async (req, res) => {
    res.json(await userService.updateMe(req.user.id, req.body));
  })
};
