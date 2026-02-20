import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const ACCESS_TOKEN_KEY = 'access_token';
const SUPER_ADMIN_ACCESS_KEY = 'super_admin_access';

let accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
let cachedSuperAdminAccess = localStorage.getItem(SUPER_ADMIN_ACCESS_KEY);

export const setAccessToken = (token) => {
  accessToken = token;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

export const getAccessToken = () => accessToken;

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  const params = new URLSearchParams(window.location.search);
  const urlAccess = params.get('access');
  if (urlAccess && urlAccess !== cachedSuperAdminAccess) {
    cachedSuperAdminAccess = urlAccess;
    localStorage.setItem(SUPER_ADMIN_ACCESS_KEY, urlAccess);
  }
  if (!cachedSuperAdminAccess && window.location.pathname.startsWith('/super-admin')) {
    cachedSuperAdminAccess = 'super-admin-secure';
    localStorage.setItem(SUPER_ADMIN_ACCESS_KEY, cachedSuperAdminAccess);
  }
  const superAdminAccess = cachedSuperAdminAccess;
  if (superAdminAccess) {
    config.params = { ...config.params, access: superAdminAccess };
    config.headers['x-super-admin-access'] = superAdminAccess;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const url = original?.url || '';
    const isAuthMe = url.includes('/auth/me');
    const isAuthLogin = url.includes('/auth/login');
    const isAuthRegister = url.includes('/auth/register');
    const isAuthLogout = url.includes('/auth/logout');
    if (
      err.response?.status === 401 &&
      !original._retry &&
      !isAuthMe &&
      !isAuthLogin &&
      !isAuthRegister &&
      !isAuthLogout
    ) {
      original._retry = true;
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const token = data.data?.accessToken;
        if (token) setAccessToken(token);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return client(original);
      } catch (refreshErr) {
        accessToken = null;
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default client;
