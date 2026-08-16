import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TutorialService {
  
  /**
   * Get all Tutorials, filtered by role and publish status
   */
  async getTutorials(userRole: string) {
    const tutorials = await prisma.tutorial.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        }
      }
    });

    return tutorials.filter(tutorial => {
      if (userRole === 'MD') return true; // MD sees everything
      
      if (!tutorial.isPublished) return false;
      
      const roles = tutorial.roleVisibility as string[];
      if (roles && roles.length > 0 && !roles.includes(userRole)) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get a single Tutorial by slug
   */
  async getTutorialBySlug(slug: string, userRole: string) {
    const tutorial = await prisma.tutorial.findUnique({
      where: { slug },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        }
      }
    });
    
    if (!tutorial) throw new Error('Tutorial not found');

    if (userRole === 'MD') return tutorial;

    if (!tutorial.isPublished) {
       throw new Error('Forbidden: Tutorial is not published');
    }

    const roles = tutorial.roleVisibility as string[];
    if (roles && roles.length > 0 && !roles.includes(userRole)) {
      throw new Error('Forbidden: You do not have access to this Tutorial');
    }

    return tutorial;
  }

  /**
   * Create Tutorial (CMS)
   */
  async createTutorial(data: {
    title: string;
    slug: string;
    category: string;
    description?: string;
    roleVisibility: string[];
    isPublished?: boolean;
    displayOrder?: number;
  }, userId: string) {
    const tutorial = await prisma.tutorial.create({
      data: {
        title: data.title,
        slug: data.slug,
        category: data.category,
        description: data.description,
        roleVisibility: data.roleVisibility || [],
        isPublished: data.isPublished ?? true,
        displayOrder: data.displayOrder ?? 0
      }
    });

    await prisma.auditLog.create({
      data: {
        actor: userId,
        action: 'CREATE_TUTORIAL',
        entity: 'Tutorial',
        entityId: tutorial.id,
        afterJson: tutorial as any
      }
    });

    return tutorial;
  }

  /**
   * Update Tutorial (CMS)
   */
  async updateTutorial(id: string, data: any, userId: string) {
    const tutorial = await prisma.tutorial.update({
      where: { id },
      data
    });

    await prisma.auditLog.create({
      data: {
        actor: userId,
        action: 'UPDATE_TUTORIAL',
        entity: 'Tutorial',
        entityId: tutorial.id,
        afterJson: tutorial as any
      }
    });

    return tutorial;
  }

  /**
   * Delete Tutorial (CMS)
   */
  async deleteTutorial(id: string, userId: string) {
    const tutorial = await prisma.tutorial.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        actor: userId,
        action: 'DELETE_TUTORIAL',
        entity: 'Tutorial',
        entityId: tutorial.id,
        beforeJson: tutorial as any
      }
    });

    return tutorial;
  }

  // ---- TUTORIAL STEPS ----

  async createTutorialStep(tutorialId: string, data: {
    stepNumber: number;
    title: string;
    explanation: string;
    targetSelector?: string;
  }, userId: string) {
    const step = await prisma.tutorialStep.create({
      data: {
        tutorialId,
        stepNumber: data.stepNumber,
        title: data.title,
        explanation: data.explanation,
        targetSelector: data.targetSelector
      }
    });

    await prisma.auditLog.create({
      data: {
        actor: userId,
        action: 'CREATE_TUTORIAL_STEP',
        entity: 'TutorialStep',
        entityId: step.id,
        afterJson: step as any
      }
    });

    return step;
  }

  async updateTutorialStep(stepId: string, data: any, userId: string) {
    const step = await prisma.tutorialStep.update({
      where: { id: stepId },
      data
    });

    await prisma.auditLog.create({
      data: {
        actor: userId,
        action: 'UPDATE_TUTORIAL_STEP',
        entity: 'TutorialStep',
        entityId: step.id,
        afterJson: step as any
      }
    });

    return step;
  }

  async deleteTutorialStep(stepId: string, userId: string) {
    const step = await prisma.tutorialStep.delete({
      where: { id: stepId }
    });

    await prisma.auditLog.create({
      data: {
        actor: userId,
        action: 'DELETE_TUTORIAL_STEP',
        entity: 'TutorialStep',
        entityId: step.id,
        beforeJson: step as any
      }
    });

    return step;
  }
}
