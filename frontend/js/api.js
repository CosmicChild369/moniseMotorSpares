/**
 * API client - all requests include credentials for httpOnly cookies
 */
const API_BASE = '/api';

async function api(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const AuthAPI = {
  login: (email, password) => api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (body) => api('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  me: () => api('/auth/me'),
  updateProfile: (body) => api('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  forgotPassword: (email) => api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, password) => api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) })
};

const ProductsAPI = {
  list: (params) => api(`/products?${new URLSearchParams(params)}`),
  get: (id) => api(`/products/${id}`),
  brands: () => api('/products/brands'),
  specials: () => api('/products/specials/today'),
  featured: () => api('/products/featured')
};

const CategoriesAPI = { list: () => api('/categories') };
const VehiclesAPI = {
  years: () => api('/vehicles/years'),
  makes: (year) => api(`/vehicles/makes?year=${year}`),
  models: (year, make) => api(`/vehicles/models?year=${year}&make=${make}`),
  engines: (year, make, model) => api(`/vehicles/engines?year=${year}&make=${make}&model=${model}`),
  resolve: (q) => api(`/vehicles/resolve?${new URLSearchParams(q)}`),
  saved: () => api('/vehicles/saved'),
  save: (vehicle_id, nickname) => api('/vehicles/saved', { method: 'POST', body: JSON.stringify({ vehicle_id, nickname }) }),
  remove: (id) => api(`/vehicles/saved/${id}`, { method: 'DELETE' })
};
const OrdersAPI = {
  create: (body) => api('/orders', { method: 'POST', body: JSON.stringify(body) }),
  track: (order_number, phone) => api('/orders/track', { method: 'POST', body: JSON.stringify({ order_number, phone }) }),
  my: () => api('/orders/my'),
  get: (num) => api(`/orders/${num}`),
  validatePromo: (code, subtotal) => api('/orders/validate-promo', { method: 'POST', body: JSON.stringify({ code, subtotal }) })
};
const PaymentsAPI = {
  payfast: (order_number) => api('/payments/payfast/initiate', { method: 'POST', body: JSON.stringify({ order_number }) })
};
const WishlistAPI = {
  list: () => api('/wishlist'),
  add: (id) => api(`/wishlist/${id}`, { method: 'POST' }),
  remove: (id) => api(`/wishlist/${id}`, { method: 'DELETE' })
};
const BannersAPI = { list: () => api('/banners') };
const NewsletterAPI = {
  subscribe: (email) => api('/newsletter', { method: 'POST', body: JSON.stringify({ email }) })
};
