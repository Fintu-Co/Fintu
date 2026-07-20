import { request } from '@/shared/services/http';

export const authApi = {
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  confirmPayment: (body) => request('/api/auth/confirm-payment', { method: 'POST', body: JSON.stringify(body) }),
  registrarSentinel: (body) => request('/api/auth/sentinel', { method: 'PUT', body: JSON.stringify(body) }),
  getSentinel: (id) => request(`/api/auth/sentinel/${id}`),
  forgotPassword:  (body)   => request('/api/auth/forgot-password',  { method: 'POST', body: JSON.stringify(body) }),
  resetPassword:   (body)   => request('/api/auth/reset-password',   { method: 'POST', body: JSON.stringify(body) }),
  getProfile:      (userId) => request(`/api/auth/profile/${userId}`),
  updateProfile:   (body)   => request('/api/auth/profile',          { method: 'PUT',  body: JSON.stringify(body) }),
  changePassword:  (body)   => request('/api/auth/change-password',  { method: 'PUT',  body: JSON.stringify(body) }),
};
