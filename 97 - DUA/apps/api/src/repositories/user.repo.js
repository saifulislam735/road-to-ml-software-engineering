import { prisma } from '../config/db.js';

export const userRepo = {
  create: (data) => prisma.user.create({ data }),
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  findByUsername: (username) => prisma.user.findUnique({ where: { username } }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  update: (id, data) => prisma.user.update({ where: { id }, data }),
  delete: (id) => prisma.user.delete({ where: { id } }),
  count: (where = {}) => prisma.user.count({ where }),
  list: ({ skip, take, where, orderBy }) =>
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      include: { _count: { select: { duas: true } } }
    })
};
