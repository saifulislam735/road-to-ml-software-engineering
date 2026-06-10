import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const userHash = await bcrypt.hash('password123', 12);
  const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'AdminPass123!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      password: userHash,
      name: 'Test User',
      bio: 'Send me a dua',
      role: 'USER'
    }
  });

  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@yourdomain.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@yourdomain.com',
      username: 'admin',
      password: adminHash,
      name: 'Admin',
      role: 'ADMIN'
    }
  });

  await prisma.dua.createMany({
    data: [
      { message: 'May Allah bless you with health and happiness.', ownerId: user.id },
      { message: 'May your prayers be answered.', ownerId: user.id },
      { message: 'May Allah make things easy for you.', ownerId: user.id }
    ],
    skipDuplicates: true
  });

  console.log('Seed complete.');
  console.log('Test user: test@example.com / password123');
  console.log(`Admin user: ${process.env.ADMIN_EMAIL || 'admin@yourdomain.com'} / ${process.env.ADMIN_PASSWORD || 'AdminPass123!'}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
