import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { faqs } from './faqData';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Seed Roles
  const roles = [
    { name: 'MD', description: 'Managing Director' },
    { name: 'CHANNEL_PARTNER_MANAGER', description: 'Channel Partner Manager' },
    { name: 'ASSOCIATE', description: 'Associate Partner' },
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
  }
  console.log('Roles seeded.');

  // 2. Seed Permissions (Foundation)
  const permissions = [
    { name: 'view:leads', description: 'View all leads' },
    { name: 'manage:users', description: 'Manage system users' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log('Permissions seeded.');

  // Assign all permissions to MD role as a demo
  const mdRole = await prisma.role.findUnique({ where: { name: 'MD' } });
  if (mdRole) {
    const allPerms = await prisma.permission.findMany();
    await prisma.role.update({
      where: { id: mdRole.id },
      data: {
        permissions: {
          connect: allPerms.map((p) => ({ id: p.id })),
        },
      },
    });
  }

  // 3. Seed Users
  const defaultPassword = 'Password123!';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

  const users = [
    {
      email: 'md@sonthillu.com',
      name: 'Managing Director',
      userIdentifier: 'RS-MD001',
      roleName: 'MD',
    },
    {
      email: 'am@sonthillu.com',
      name: 'Channel Partner Manager',
      userIdentifier: 'RS-CPM01',
      roleName: 'CHANNEL_PARTNER_MANAGER',
    },
    {
      email: 'associate@sonthillu.com',
      name: 'Test Associate',
      userIdentifier: 'RS-ASC01',
      roleName: 'ASSOCIATE',
    },
  ];

  for (const userData of users) {
    const role = await prisma.role.findUnique({ where: { name: userData.roleName } });
    if (!role) continue;

    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        userIdentifier: userData.userIdentifier,
        passwordHash,
        roleId: role.id,
      },
    });
  }
  console.log('Users seeded.');

  // 4. Seed FAQs
  let faqCount = 0;
  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({
      where: { category: faq.category, question: faq.question }
    });
    if (!existing) {
      await prisma.faq.create({
        data: {
          category: faq.category,
          question: faq.question,
          answer: faq.answer,
          roleVisibility: ["MD", "CHANNEL_PARTNER_MANAGER", "ASSOCIATE"],
          isPublished: true,
        }
      });
      faqCount++;
    }
  }
  console.log(`Seeded ${faqCount} FAQs (skipped existing).`);

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
