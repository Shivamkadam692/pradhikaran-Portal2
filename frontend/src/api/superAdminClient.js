import client, { setAccessToken } from './client';

const getSuperAdminBase = () => {
  const params = new URLSearchParams(window.location.search);
  const access = params.get('access') || localStorage.getItem('super_admin_access');
  if (access || window.location.pathname.startsWith('/super-admin')) {
    return '/super-admin';
  }
  return '';
};

export async function superAdminGet(path) {
  const base = getSuperAdminBase();
  const { data } = await client.get(`${base}${path}`);
  return data;
}

export async function superAdminPost(path, body) {
  const base = getSuperAdminBase();
  const { data } = await client.post(`${base}${path}`, body);
  return data;
}

export function useSuperAdminApi() {
  const base = getSuperAdminBase();
  return {
    get: (path) => client.get(`${base}${path}`).then((r) => r.data),
    post: (path, body) => client.post(`${base}${path}`, body).then((r) => r.data),
  };
}
