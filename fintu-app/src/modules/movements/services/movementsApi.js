import { request } from '@/shared/services/http';

export const movementsApi = {
  getByCard: (tarjetaId) => request(`/api/movements/card/${tarjetaId}`),
  getChartDetailed: (tarjetaId) => request(`/api/movements/chart-detailed/${tarjetaId}`),
  getByCycle: (params) => request(`/api/movements/cycle?${new URLSearchParams(params)}`),
  /* Rango real del ciclo (desde/hasta en 'YYYY-MM-DD'). Preferir sobre
     getByCycle: este respeta ciclos que cruzan de mes. */
  getByRange: (params) => request(`/api/movements/range?${new URLSearchParams(params)}`),
  create: (body) => request('/api/movements/create', { method: 'POST', body: JSON.stringify(body) }),
  getStats: (tarjetaId) => request(`/api/movements/stats/${tarjetaId}`),
  getChart: (tarjetaId) => request(`/api/movements/chart/${tarjetaId}`),
  delete: (body) => request('/api/movements/delete', { method: 'DELETE', body: JSON.stringify(body) }),
  cleanup: (body) => request('/api/movements/cleanup', { method: 'POST', body: JSON.stringify(body) }),
};
