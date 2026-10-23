import { request } from '@/shared/services/http';

export const goalsApi = {
  getByUser: (userId) => request(`/api/goals/user?userId=${userId}`),
  create: (body) => request('/api/goals/create', { method: 'POST', body: JSON.stringify(body) }),
  updateProgress: (body) => request('/api/goals/progreso', { method: 'PUT', body: JSON.stringify(body) }),
  complete: (body) => request('/api/goals/completar', { method: 'PUT', body: JSON.stringify(body) }),
  sync: (body) => request('/api/goals/sincronizar', { method: 'PUT', body: JSON.stringify(body) }),
  delete: (body) => request('/api/goals/eliminar', { method: 'DELETE', body: JSON.stringify(body) }),
};
