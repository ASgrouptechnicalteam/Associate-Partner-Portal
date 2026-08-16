import api from './api';
import type { Tutorial, TutorialStep } from '../types/tutorial';

export const getTutorials = async (): Promise<Tutorial[]> => {
  const response = await api.get('/v1/tutorials');
  return response.data.data;
};

export const getTutorialBySlug = async (slug: string): Promise<Tutorial> => {
  const response = await api.get(`/v1/tutorials/${slug}`);
  return response.data.data;
};

export const createTutorial = async (data: Partial<Tutorial>): Promise<Tutorial> => {
  const response = await api.post('/v1/tutorials', data);
  return response.data.data;
};

export const updateTutorial = async (id: string, data: Partial<Tutorial>): Promise<Tutorial> => {
  const response = await api.patch(`/v1/tutorials/${id}`, data);
  return response.data.data;
};

export const deleteTutorial = async (id: string): Promise<void> => {
  await api.delete(`/v1/tutorials/${id}`);
};

export const createTutorialStep = async (tutorialId: string, data: Partial<TutorialStep>): Promise<TutorialStep> => {
  const response = await api.post(`/v1/tutorials/${tutorialId}/steps`, data);
  return response.data.data;
};

export const updateTutorialStep = async (tutorialId: string, stepId: string, data: Partial<TutorialStep>): Promise<TutorialStep> => {
  const response = await api.patch(`/v1/tutorials/${tutorialId}/steps/${stepId}`, data);
  return response.data.data;
};

export const deleteTutorialStep = async (tutorialId: string, stepId: string): Promise<void> => {
  await api.delete(`/v1/tutorials/${tutorialId}/steps/${stepId}`);
};
