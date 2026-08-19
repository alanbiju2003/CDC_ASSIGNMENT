const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('kickvault_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('kickvault_token', token);
  } else {
    localStorage.removeItem('kickvault_token');
  }
}

export async function apiRequest(endpoint, method = 'GET', data = null, customHeaders = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  
  if (response.status === 401) {
    // If token invalid, clear local auth
    // setAuthToken(null);
  }

  // If download PDF request
  if (headers['Accept'] === 'application/pdf' || endpoint.endsWith('/pdf')) {
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to download PDF.');
    }
    return await response.blob();
  }

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || 'API request failed.');
  }

  return json;
}

export const API = {
  // Auth & KYC
  login: (email, password) => apiRequest('/auth/login', 'POST', { email, password }),
  loginVendor: (email, password) => apiRequest('/auth/vendor/login', 'POST', { email, password }),
  loginAdmin: (email, password) => apiRequest('/auth/admin/login', 'POST', { email, password }),
  registerVendor: (data) => apiRequest('/auth/vendor/register', 'POST', data),
  getMe: () => apiRequest('/me'),
  verifyKyc: (data) => apiRequest('/kyc/verify', 'POST', typeof data === 'string' ? { pan: data } : data),
  getKycRecord: (email = '') => apiRequest(`/kyc/record${email ? `?email=${encodeURIComponent(email)}` : ''}`),
  getAdminKycQueue: () => apiRequest('/admin/kyc/queue'),
  getAdminVendors: () => apiRequest('/admin/vendors'),
  respondAdminKyc: (id, action, rejectionReason = '') => apiRequest(`/admin/kyc/${encodeURIComponent(id)}/respond`, 'POST', { action, rejectionReason }),
  getEmails: () => apiRequest('/emails'),

  // Inventory
  getShoes: () => apiRequest('/shoes'),
  createShoe: (data) => apiRequest('/shoes', 'POST', data),
  bulkCreateShoes: (items) => apiRequest('/shoes/bulk', 'POST', { items }),
  updateShoe: (id, data) => apiRequest(`/shoes/${id}`, 'PATCH', data),
  adminPriceShoe: (id, adminPrice, status) => apiRequest(`/admin/shoes/${id}/price`, 'POST', { adminPrice, status }),

  // MRNs
  getMrns: () => apiRequest('/mrn'),
  createMrn: (vendorEmail, items) => apiRequest('/mrn', 'POST', { vendorEmail, items }),
  signMrn: (id, signedByName) => apiRequest(`/mrn/${id}/sign`, 'POST', { signedByName }),

  // Invoices & Payments
  getInvoices: () => apiRequest('/invoices'),
  createInvoice: (vendorEmail, lines, commissionPct) => apiRequest('/invoices', 'POST', { vendorEmail, lines, commissionPct }),
  sendInvoice: (id) => apiRequest(`/invoices/${id}/send`, 'POST'),
  cancelInvoice: (id) => apiRequest(`/invoices/${id}/cancel`, 'POST'),
  getPaymentSummary: (vendorEmail = '') => apiRequest(`/payments/summary${vendorEmail ? `?vendorEmail=${encodeURIComponent(vendorEmail)}` : ''}`),

  // Price & Return Requests
  getPriceRequests: () => apiRequest('/price-requests'),
  createPriceRequest: (shoeId, requestedPrice) => apiRequest('/price-requests', 'POST', { shoeId, requestedPrice }),
  respondPriceRequest: (id, action) => apiRequest(`/admin/price-requests/${id}/respond`, 'POST', { action }),

  getReturnRequests: () => apiRequest('/return-requests'),
  createReturnRequest: (shoeId, reason) => apiRequest('/return-requests', 'POST', { shoeId, reason }),
  respondReturnRequest: (id, action) => apiRequest(`/admin/return-requests/${id}/respond`, 'POST', { action }),

  // Chat
  getChatMessages: (vendorId) => apiRequest(`/chat/${encodeURIComponent(vendorId)}/messages`),
  sendChatMessage: (vendorId, message) => apiRequest(`/chat/${encodeURIComponent(vendorId)}/messages`, 'POST', { message }),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, 'PATCH'),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', 'PATCH'),

  // Scheduled Cron Sync
  triggerCronSync: (secret = 'kickvault_cron_secret_2026') => apiRequest('/cron/sync', 'POST', null, { 'x-cron-secret': secret }),

  // Dashboard
  getDashboardStats: () => apiRequest('/dashboard/stats')
};
