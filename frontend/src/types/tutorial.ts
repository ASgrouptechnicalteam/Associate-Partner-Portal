export interface TutorialStep {
  id: string;
  tutorialId: string;
  stepNumber: number;
  title: string;
  explanation: string;
  targetSelector?: string;
  targetRoute?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tutorial {
  id: string;
  title: string;
  slug: string;
  category: string;
  description?: string;
  roleVisibility: string[];
  isPublished: boolean;
  displayOrder: number;
  steps: TutorialStep[];
  createdAt: string;
  updatedAt: string;
}
