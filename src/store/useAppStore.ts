import { create } from 'zustand';
import { SimulationTask, User, DashboardStats, WarningRecord, CaseProfile } from '../../shared/types';
import { taskApi, statsApi, warningApi, userApi, caseApi, approvalApi } from '../lib/api';

interface AppState {
  tasks: SimulationTask[];
  currentTask: SimulationTask | null;
  stats: DashboardStats | null;
  warnings: WarningRecord[];
  users: User[];
  cases: CaseProfile[];
  currentUser: User;
  loading: boolean;
  fetchTasks: () => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchWarnings: () => Promise<void>;
  fetchAll: () => Promise<void>;
  createTask: (data: any) => Promise<SimulationTask>;
  startTask: (id: string) => Promise<void>;
  reviewWarning: (id: string, data: any) => Promise<void>;
  submitApproval: (taskId: string, data: any) => Promise<void>;
  pushToSurgery: (taskId: string) => Promise<void>;
}

const mockUser: User = {
  id: 'u1',
  name: '张工程师',
  role: 'engineer',
  email: 'zhang.eng@hospital.com',
};

export const useAppStore = create<AppState>((set, get) => ({
  tasks: [],
  currentTask: null,
  stats: null,
  warnings: [],
  users: [],
  cases: [],
  currentUser: mockUser,
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const tasks = await taskApi.list();
      set({ tasks, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  fetchTask: async (id: string) => {
    set({ loading: true });
    try {
      const task = await taskApi.get(id);
      set({ currentTask: task, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await statsApi.daily();
      set({ stats });
    } catch (e) {}
  },

  fetchWarnings: async () => {
    try {
      const warnings = await warningApi.list();
      set({ warnings });
    } catch (e) {}
  },

  fetchAll: async () => {
    set({ loading: true });
    try {
      const [tasks, stats, warnings, users, cases] = await Promise.all([
        taskApi.list(),
        statsApi.daily(),
        warningApi.list(),
        userApi.list(),
        caseApi.list(),
      ]);
      set({ tasks, stats, warnings, users, cases, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  createTask: async (data: any) => {
    const task = await taskApi.create(data);
    set(s => ({ tasks: [task, ...s.tasks] }));
    return task;
  },

  startTask: async (id: string) => {
    const task = await taskApi.start(id);
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? task : t),
      currentTask: s.currentTask?.id === id ? task : s.currentTask,
    }));
  },

  reviewWarning: async (id: string, data: any) => {
    const task = await taskApi.review(id, data);
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? task : t),
      currentTask: s.currentTask?.id === id ? task : s.currentTask,
      warnings: s.warnings.filter(w => w.taskId !== id || data.reviewResult),
    }));
  },

  submitApproval: async (taskId: string, data: any) => {
    const task = await approvalApi.submit(taskId, data);
    set(s => ({
      tasks: s.tasks.map(t => t.id === taskId ? task : t),
      currentTask: s.currentTask?.id === taskId ? task : s.currentTask,
    }));
  },

  pushToSurgery: async (taskId: string) => {
    const task = await approvalApi.push(taskId);
    set(s => ({
      tasks: s.tasks.map(t => t.id === taskId ? task : t),
      currentTask: s.currentTask?.id === taskId ? task : s.currentTask,
    }));
  },
}));
