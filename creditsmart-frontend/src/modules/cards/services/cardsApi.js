import { request } from '@/shared/services/http';

export const cardsApi = {
  getUserCards: (userId) => request(`/api/cards/user?userId=${userId}`),
  getBancos: () => request('/api/cards/bancos'),
  getCardById: (id) => request(`/api/cards/${id}`),
  updateCard: (body) => request('/api/cards/update', { method: 'PUT', body: JSON.stringify(body) }),
  clearCard: (body) => request('/api/cards/clear', { method: 'PUT', body: JSON.stringify(body) }),
  updateDeuda: (body) => request('/api/cards/update-deuda', { method: 'PUT', body: JSON.stringify(body) }),
};
