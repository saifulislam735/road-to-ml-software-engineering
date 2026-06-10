import { duaRepo } from '../repositories/dua.repo.js';
import { userRepo } from '../repositories/user.repo.js';
import { adminRepo } from '../repositories/admin.repo.js';
import { AppError } from '../utils/errors.js';

function pagination(page = 1, limit = 20) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

export const duaService = {
  async send(username, data) {
    const owner = await userRepo.findByUsername(username);
    if (!owner || owner.isBanned) throw new AppError('User not found', 404);
    if (owner.isPaused) throw new AppError('This user is not accepting duas right now.', 403);
    return duaRepo.create({ message: data.message, ownerId: owner.id });
  },

  async inbox(userId, query) {
    const { page, limit, skip } = pagination(query.page, query.limit);
    const unreadOnly = query.unreadOnly === 'true' || query.unreadOnly === true;
    const where = { ownerId: userId, isHidden: false, ...(unreadOnly ? { isRead: false } : {}) };
    const [duas, total] = await Promise.all([
      duaRepo.listInbox({ ownerId: userId, skip, take: limit, unreadOnly }),
      duaRepo.count(where)
    ]);
    return { duas, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async markRead(userId, id) {
    const dua = await duaRepo.findById(id);
    if (!dua) throw new AppError('Dua not found', 404);
    if (dua.ownerId !== userId) throw new AppError('Not authorized', 403);
    return duaRepo.update(id, { isRead: true });
  },

  async deleteOwn(userId, id) {
    const dua = await duaRepo.findById(id);
    if (!dua) throw new AppError('Dua not found', 404);
    if (dua.ownerId !== userId) throw new AppError('Not authorized', 403);
    await duaRepo.delete(id);
    return { ok: true };
  },

  async report(id, data, reporterId) {
    const dua = await duaRepo.findById(id);
    if (!dua) throw new AppError('Dua not found', 404);
    return adminRepo.createReport({ duaId: id, reason: data.reason, reporterId });
  }
};
