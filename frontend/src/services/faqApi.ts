import api from './api';
import type { Faq } from '../types/faq';

export const getFaqs = async (): Promise<Faq[]> => {
  const response = await api.get('/v1/faqs');
  return response.data.data;
};

export const getFaqById = async (id: string): Promise<Faq> => {
  const response = await api.get(`/v1/faqs/${id}`);
  return response.data.data;
};

export const createFaq = async (data: Partial<Faq>): Promise<Faq> => {
  const response = await api.post('/v1/faqs', data);
  return response.data.data;
};

export const updateFaq = async (id: string, data: Partial<Faq>): Promise<Faq> => {
  const response = await api.patch(`/v1/faqs/${id}`, data);
  return response.data.data;
};

export const deleteFaq = async (id: string): Promise<void> => {
  await api.delete(`/v1/faqs/${id}`);
};
