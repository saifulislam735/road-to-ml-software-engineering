import { prisma } from '../config/db.js';

export const adminRepo = {
  createReport: (data) => prisma.report.create({ data }),
  reportCount: (where = {}) => prisma.report.count({ where }),
  listReports: ({ skip, take, where }) =>
    prisma.report.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        dua: {
          include: {
            owner: { select: { id: true, username: true, name: true } }
          }
        },
        filer: { select: { id: true, username: true } }
      }
    }),
  findReport: (id) => prisma.report.findUnique({ where: { id }, include: { dua: true } }),
  updateReport: (id, data) => prisma.report.update({ where: { id }, data }),
  userCountByDay: async (days) =>
    prisma.$queryRaw`
      SELECT date_trunc('day', "createdAt")::date AS date, COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= NOW() - (${days} || ' days')::interval
      GROUP BY 1
      ORDER BY 1 ASC
    `
};
