import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  await prisma.adminUser.upsert({
    where: { email: 'admin@tivask.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@tivask.com',
      passwordHash,
    },
  });

  console.log('Seed completed: Admin user created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
