import { userRepo } from '../repositories/user.repo.js';
import { AppError, sanitizeUser } from '../utils/errors.js';

export const userService = {
  async getPublicProfile(username) {
    const user = await userRepo.findByUsername(username);
    if (!user || user.isBanned) throw new AppError('User not found', 404);
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isPaused: user.isPaused
    };
  },

  async updateMe(userId, data) {
    if (data.username) {
      const existing = await userRepo.findByUsername(data.username);
      if (existing && existing.id !== userId) throw new AppError('Username already taken', 409);
    }
    const user = await userRepo.update(userId, data);
    return sanitizeUser(user);
  }
};
