import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export const taskApi = {
  list: () => api.get('/tasks').then(r => r.data),
  get: (id: string) => api.get(`/tasks/${id}`).then(r => r.data),
  create: (data: any) => api.post('/tasks', data).then(r => r.data),
  start: (id: string) => api.post(`/tasks/${id}/start`).then(r => r.data),
  review: (id: string, data: any) => api.post(`/tasks/${id}/review`, data).then(r => r.data),
};

export const approvalApi = {
  list: () => api.get('/approvals').then(r => r.data),
  submit: (taskId: string, data: any) => api.post(`/approvals/${taskId}`, data).then(r => r.data),
  push: (taskId: string) => api.post(`/approvals/${taskId}/push`).then(r => r.data),
};

export const statsApi = {
  daily: () => api.get('/statistics/daily').then(r => r.data),
};

export const warningApi = {
  list: () => api.get('/warnings').then(r => r.data),
};

export const userApi = {
  list: () => api.get('/users').then(r => r.data),
};

export const caseApi = {
  list: () => api.get('/cases').then(r => r.data),
};

export default api;
