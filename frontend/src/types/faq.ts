export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  roleVisibility: string[];
  isPublished: boolean;
  displayOrder: number;
  relatedTutorialSlug?: string;
  createdAt: string;
  updatedAt: string;
}
