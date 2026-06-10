import { prisma } from '../config/db.js';
import { adminRepo } from '../repositories/admin.repo.js';
import { duaRepo } from '../repositories/dua.repo.js';
import { userRepo } from '../repositories/user.repo.js';
import { AppError, sanitizeUser } from '../utils/errors.js';

function pagination(page = 1, limit = 20) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function fillSevenDays(rows) {
  const map = new Map(rows.map((row) => [new Date(row.date).toISOString().slice(0, 10), Number(row.count)]));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: map.get(key) || 0 };
  });
}

export const adminService = {
  async stats(chart) {
    if (chart === 'duas_daily') return fillSevenDays(await duaRepo.countByDay(7));
    if (chart === 'users_daily') return fillSevenDays(await adminRepo.userCountByDay(7));

    const today = startOfToday();
    const [usersTotal, usersToday, usersBanned, duasTotal, duasToday, duasHidden, reportsPending, reportsResolved, reportsDismissed] =
      await Promise.all([
        userRepo.count(),
        userRepo.count({ createdAt: { gte: today } }),
        userRepo.count({ isBanned: true }),
        duaRepo.count(),
        duaRepo.count({ createdAt: { gte: today } }),
        duaRepo.count({ isHidden: true }),
        adminRepo.reportCount({ status: 'pending' }),
        adminRepo.reportCount({ status: 'resolved' }),
        adminRepo.reportCount({ status: 'dismissed' })
      ]);

    return {
      users: { total: usersTotal, today: usersToday, banned: usersBanned },
      duas: { total: duasTotal, today: duasToday, hidden: duasHidden },
      reports: { pending: reportsPending, resolved: reportsResolved, dismissed: reportsDismissed }
    };
  },

  async users(query) {
    const { page, limit, skip } = pagination(query.page, query.limit);
    const where = {
      ...(query.search
        ? {
            OR: [
              { username: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(query.banned === 'true' ? { isBanned: true } : {}),
      ...(query.banned === 'false' ? { isBanned: false } : {})
    };
    const [users, total] = await Promise.all([
      userRepo.list({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      userRepo.count(where)
    ]);
    return {
      users: users.map((user) => sanitizeUser(user, { includeBanDetails: true })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  },

  async user(id) {
    const user = await userRepo.findById(id);
    if (!user) throw new AppError('User not found', 404);
    const [duas, reportCount] = await Promise.all([
      duaRepo.recentForUser(id, 20),
      adminRepo.reportCount({ dua: { ownerId: id } })
    ]);
    return { user: sanitizeUser(user, { includeBanDetails: true }), duas, reportCount };
  },

  async banUser(id, reason) {
    const user = await userRepo.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return sanitizeUser(
      await userRepo.update(id, { isBanned: true, banReason: reason, bannedAt: new Date() }),
      { includeBanDetails: true }
    );
  },

  async unbanUser(id) {
    const user = await userRepo.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return sanitizeUser(
      await userRepo.update(id, { isBanned: false, banReason: null, bannedAt: null }),
      { includeBanDetails: true }
    );
  },

  async deleteUser(id) {
    await userRepo.delete(id);
    return { ok: true };
  },

  async duas(query) {
    const { page, limit, skip } = pagination(query.page, query.limit);
    const where = {
      ...(query.hidden === 'true' ? { isHidden: true } : {}),
      ...(query.hidden === 'false' ? { isHidden: false } : {}),
      ...(query.reported === 'true' ? { reports: { some: {} } } : {})
    };
    const [duas, total] = await Promise.all([
      duaRepo.listAdmin({ where, skip, take: limit }),
      duaRepo.count(where)
    ]);
    return { duas, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async setDuaHidden(id, isHidden) {
    return duaRepo.update(id, { isHidden });
  },

  async deleteDua(id) {
    await duaRepo.delete(id);
    return { ok: true };
  },

  async reports(query) {
    const { page, limit, skip } = pagination(query.page, query.limit);
    const where = query.status ? { status: query.status } : {};
    const [reports, total] = await Promise.all([
      adminRepo.listReports({ where, skip, take: limit }),
      adminRepo.reportCount(where)
    ]);
    return { reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async resolveReport(id, hideDua) {
    const report = await adminRepo.findReport(id);
    if (!report) throw new AppError('Report not found', 404);
    return prisma.$transaction(async (tx) => {
      if (hideDua) await tx.dua.update({ where: { id: report.duaId }, data: { isHidden: true } });
      return tx.report.update({ where: { id }, data: { status: 'resolved' } });
    });
  },

  async dismissReport(id) {
    return adminRepo.updateReport(id, { status: 'dismissed' });
  }
};
