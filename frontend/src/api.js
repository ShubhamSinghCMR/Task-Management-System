const BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('access');
}

export function setToken(access) {
  localStorage.setItem('access', access);
}

export function clearToken() {
  localStorage.removeItem('access');
}

export function isLoggedIn() {
  return !!getToken();
}

async function request(path, options = {}) {
  const url = BASE + path;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && !path.includes('/api/token/')) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res;
}

export async function apiGet(path) {
  const res = await request(path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(path, body) {
  const res = await request(path, { method: 'POST', body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  return text ? JSON.parse(text) : {};
}

export async function apiPatch(path, body) {
  const res = await request(path, { method: 'PATCH', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(path) {
  const res = await request(path, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
}

export function getFriendlyErrorMessage(text) {
  if (!text || typeof text !== 'string') return text || 'Something went wrong';
  try {
    const data = JSON.parse(text);
    if (data.detail && typeof data.detail === 'string') return data.detail;
    if (data.detail && Array.isArray(data.detail)) return data.detail[0] || text;
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (Array.isArray(val) && val.length) return val[0];
      if (typeof val === 'string') return val;
    }
  } catch (_) {}
  return text;
}

export async function login(username, password) {
  const data = await apiPost('/api/token/', { username, password });
  setToken(data.access);
  return data;
}

export async function register(username, password, organization_id, email = '') {
  return apiPost('/api/register/', { username, password, organization_id, email });
}

export async function getMe() {
  return apiGet('/api/me/');
}

export async function getOrganizations() {
  const res = await fetch(BASE + '/api/organizations/');
  return res.json();
}

export async function getProjects() {
  return apiGet('/api/projects/');
}

export async function createProject(name) {
  return apiPost('/api/projects/', { name });
}

export async function updateProject(id, name) {
  return apiPatch(`/api/projects/${id}/`, { name });
}

export async function deleteProject(id) {
  return apiDelete(`/api/projects/${id}/`);
}

export async function getTasks(projectId, page = 1, pageSize = 10, status = null) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (projectId) params.set('project', String(projectId));
  if (status && ['todo', 'in_progress', 'done'].includes(status)) params.set('status', status);
  return apiGet(`/api/tasks/?${params}`);
}

export async function getTask(id) {
  return apiGet(`/api/tasks/${id}/`);
}

export async function createTask(project, title, status = 'todo', assignee = null) {
  return apiPost('/api/tasks/', { project, title, status, assignee });
}

export async function updateTask(id, data) {
  return apiPatch(`/api/tasks/${id}/`, data);
}

export async function deleteTask(id) {
  return apiDelete(`/api/tasks/${id}/`);
}

export async function getOrgUsers() {
  return apiGet('/api/users/');
}

export async function getTaskComments(taskId) {
  return apiGet(`/api/tasks/${taskId}/comments/`);
}

export async function addComment(taskId, body) {
  return apiPost(`/api/tasks/${taskId}/comments/`, { body });
}
