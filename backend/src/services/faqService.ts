import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FaqService {
  /**
   * Get all FAQs, filtered by role and publish status
   */
  async getFaqs(userRole: string) {
    const faqs = await prisma.faq.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    // Filter logic: Only return if isPublished (or user is MD) and role Visibility matches
    return faqs.filter(faq => {
      if (userRole === 'MD') return true; // MD sees everything
      
      if (!faq.isPublished) return false;
      
      const roles = faq.roleVisibility as string[];
      if (roles && roles.length > 0 && !roles.includes(userRole)) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get a single FAQ by ID
   */
  async getFaqById(id: string, userRole: string) {
    const faq = await prisma.faq.findUnique({
      where: { id }
    });
    
    if (!faq) throw new Error('FAQ not found');

    if (userRole === 'MD') return faq;

    if (!faq.isPublished) {
       throw new Error('Forbidden: FAQ is not published');
    }

    const roles = faq.roleVisibility as string[];
    if (roles && roles.length > 0 && !roles.includes(userRole)) {
      throw new Error('Forbidden: You do not have access to this FAQ');
    }

    return faq;
  }

  /**
   * Create FAQ (CMS)
   */
  async createFaq(data: {
    question: string;
    answer: string;
    category: string;
    roleVisibility: string[];
    isPublished?: boolean;
    displayOrder?: number;
    relatedTutorialSlug?: string;
  }, userId: string) {
    const faq = await prisma.faq.create({
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category,
        roleVisibility: data.roleVisibility || [],
        isPublished: data.isPublished ?? true,
        displayOrder: data.displayOrder ?? 0,
        relatedTutorialSlug: data.relatedTutorialSlug
      }
    });

    await prisma.auditLog.create({
      data: {
        actor: userId,
        action: 'CREATE_FAQ',
        entity: 'Faq',
        entityId: faq.id,
        afterJson: faq as any
      }
    });

    return faq;
  }

  /**
   * Update FAQ (CMS)
   */
  async updateFaq(id: string, data: any, userId: string) {
    const faq = await prisma.faq.update({
      where: { id },
      data
    });

    await prisma.auditLog.create({
      data: {
        actor: userId,
        action: 'UPDATE_FAQ',
        entity: 'Faq',
        entityId: faq.id,
        afterJson: faq as any
      }
    });

    return faq;
  }

  /**
   * Delete FAQ (CMS)
   */
  async deleteFaq(id: string, userId: string) {
    const faq = await prisma.faq.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        actor: userId,
        action: 'DELETE_FAQ',
        entity: 'Faq',
        entityId: faq.id,
        beforeJson: faq as any
      }
    });

    return faq;
  }
}
