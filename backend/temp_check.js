const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const u = await prisma.user.count();
  const o = await prisma.offer.count();
  const c = await prisma.carouselItem.count();
  const p = await prisma.promotionalPopup.count();
  console.log(`Users: ${u}, Offers: ${o}, Carousel: ${c}, Popups: ${p}`);
}
check().finally(() => prisma.$disconnect());
