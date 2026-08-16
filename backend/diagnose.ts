import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Connecting to Prisma...');
  try {
    const project = await prisma.project.findFirst({
      include: { media: true }
    });
    
    if (!project) {
      console.log('No projects found');
      return;
    }
    
    console.log('Found project:', project.id);
    
    if (!project.media || project.media.length === 0) {
      console.log('No media found for project');
      return;
    }
    
    const media = project.media[0];
    console.log('Found media:', media.id);
    
    console.log('\n--- SIMULATING SET COVER ---');
    console.log('1. Fetching media...');
    const mediaRecord = await prisma.projectMedia.findUnique({ where: { id: media.id } });
    if (!mediaRecord) {
      console.log('Media not found in findUnique');
      return;
    }
    
    console.log('2. Running transaction...');
    try {
      await prisma.$transaction([
        prisma.projectMedia.updateMany({
          where: { projectId: mediaRecord.projectId },
          data: { isCover: false }
        }),
        prisma.projectMedia.update({
          where: { id: mediaRecord.id },
          data: { isCover: true }
        })
      ]);
      console.log('Transaction SUCCESS!');
    } catch (e: any) {
      console.error('Transaction FAILED!');
      console.error(e);
    }
  } catch (e) {
    console.error('General error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
