import axios from 'axios';
import { GeometryFileInfo, ValidationFailure, UserRole } from '../../shared/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export const taskApi = {
  list: () => api.get('/tasks').then(r => r.data),
  get: (id: string) => api.get(`/tasks/${id}`).then(r => r.data),
  create: (data: {
    caseName: string;
    patientName: string;
    vesselType: string;
    bloodParams: { viscosity: number; density: number; flowRate: number };
    stressThreshold: number;
    geometryFile?: GeometryFileInfo;
  }) => api.post('/tasks', data).then(r => r.data),
  start: (id: string) => api.post(`/tasks/${id}/start`).then(r => r.data),
  retryValidation: (id: string) => api.post(`/tasks/${id}/retry-validation`).then(r => r.data),
  review: (id: string, data: { reviewResult: 'approve_adjust' | 'reject'; reviewer: string; role: UserRole; comment?: string }) =>
    api.post(`/tasks/${id}/review`, data).then(r => r.data),
  adjustments: (id: string) => api.get(`/tasks/${id}/adjustments`).then(r => r.data),
};

export const approvalApi = {
  list: () => api.get('/approvals').then(r => r.data),
  submit: (taskId: string, data: { level: 1 | 2; result: 'approved' | 'rejected'; comment: string; reviewer: string; role: UserRole }) =>
    api.post(`/approvals/${taskId}`, data).then(r => r.data),
  push: (taskId: string, role: UserRole) => api.post(`/approvals/${taskId}/push`, { role }).then(r => r.data),
};

export const statsApi = {
  daily: () => api.get('/statistics/daily').then(r => r.data),
};

export const warningApi = {
  list: () => api.get('/warnings').then(r => r.data),
};

export const userApi = {
  list: () => api.get('/users').then(r => r.data),
  permissions: (role: UserRole) => api.get(`/role-permissions?role=${role}`).then(r => r.data),
};

export const caseApi = {
  list: () => api.get('/cases').then(r => r.data),
};

export const pausedVesselApi = {
  list: () => api.get('/paused-vessels').then(r => r.data),
  resolve: (id: string, data: { role: UserRole; handledBy: string; resolution?: string; allowNewTasks?: boolean }) =>
    api.post(`/paused-vessels/${id}/resolve`, data).then(r => r.data),
};

export default api;
