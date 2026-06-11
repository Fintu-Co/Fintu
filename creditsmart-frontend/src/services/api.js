const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: authHeaders(options.headers),
  });

  const data = await res.json();

  if (res.status === 401 && getToken()) {
    // Token expirado: limpiar sesión y redirigir
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────
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

// ── Cards ─────────────────────────────────────────────────────────────
export const cardsApi = {
  getUserCards: (userId) => request(`/api/cards/user?userId=${userId}`),
  getBancos: () => request('/api/cards/bancos'),
  getCardById: (id) => request(`/api/cards/${id}`),
  updateCard: (body) => request('/api/cards/update', { method: 'PUT', body: JSON.stringify(body) }),
  clearCard: (body) => request('/api/cards/clear', { method: 'PUT', body: JSON.stringify(body) }),
  updateDeuda: (body) => request('/api/cards/update-deuda', { method: 'PUT', body: JSON.stringify(body) }),
};

// ── Movements ─────────────────────────────────────────────────────────
export const movementsApi = {
  getByCard: (tarjetaId) => request(`/api/movements/card/${tarjetaId}`),
  getChartDetailed: (tarjetaId) => request(`/api/movements/chart-detailed/${tarjetaId}`),
  getByCycle: (params) => request(`/api/movements/cycle?${new URLSearchParams(params)}`),
  create: (body) => request('/api/movements/create', { method: 'POST', body: JSON.stringify(body) }),
  getStats: (tarjetaId) => request(`/api/movements/stats/${tarjetaId}`),
  getChart: (tarjetaId) => request(`/api/movements/chart/${tarjetaId}`),
  delete: (body) => request('/api/movements/delete', { method: 'DELETE', body: JSON.stringify(body) }),
  cleanup: (body) => request('/api/movements/cleanup', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Analytics ─────────────────────────────────────────────────────────
export const analyticsApi = {
  getUsageAnalysis: (tarjetaId) => request(`/api/analytics/usage-analysis/${tarjetaId}`),
};

// ── Goals ─────────────────────────────────────────────────────────────
export const goalsApi = {
  getByUser: (userId) => request(`/api/goals/user?userId=${userId}`),
  create: (body) => request('/api/goals/create', { method: 'POST', body: JSON.stringify(body) }),
  updateProgress: (body) => request('/api/goals/progreso', { method: 'PUT', body: JSON.stringify(body) }),
  complete: (body) => request('/api/goals/completar', { method: 'PUT', body: JSON.stringify(body) }),
  sync: (body) => request('/api/goals/sincronizar', { method: 'PUT', body: JSON.stringify(body) }),
  delete: (body) => request('/api/goals/eliminar', { method: 'DELETE', body: JSON.stringify(body) }),
};
