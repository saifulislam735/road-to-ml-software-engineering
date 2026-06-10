import { prisma } from '../config/db.js';

export const duaRepo = {
  create: (data) => prisma.dua.create({ data }),
  findById: (id) => prisma.dua.findUnique({ where: { id }, include: { owner: true } }),
  update: (id, data) => prisma.dua.update({ where: { id }, data }),
  delete: (id) => prisma.dua.delete({ where: { id } }),
  count: (where = {}) => prisma.dua.count({ where }),
  listInbox: ({ ownerId, skip, take, unreadOnly }) =>
    prisma.dua.findMany({
      where: { ownerId, isHidden: false, ...(unreadOnly ? { isRead: false } : {}) },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    }),
  listAdmin: ({ skip, take, where }) =>
    prisma.dua.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, username: true, name: true } },
        _count: { select: { reports: true } }
      }
    }),
  recentForUser: (ownerId, take = 20) =>
    prisma.dua.findMany({
      where: { ownerId },
      take,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { reports: true } } }
    }),
  countByDay: async (days) =>
    prisma.$queryRaw`
      SELECT date_trunc('day', "createdAt")::date AS date, COUNT(*)::int AS count
      FROM "Dua"
      WHERE "createdAt" >= NOW() - (${days} || ' days')::interval
      GROUP BY 1
      ORDER BY 1 ASC
    `
};
