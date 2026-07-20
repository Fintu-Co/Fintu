import { request } from '@/shared/services/http';

export const analyticsApi = {
  getUsageAnalysis: (tarjetaId) => request(`/api/analytics/usage-analysis/${tarjetaId}`),
};
