import { create } from 'zustand';
import { SimulationTask, User, DashboardStats, WarningRecord, CaseProfile, UserRole, PausedVesselRecord } from '../../shared/types';
import { taskApi, statsApi, warningApi, userApi, caseApi, approvalApi, pausedVesselApi } from '../lib/api';

interface Permissions {
  canApproveLevel1: boolean;
  canApproveLevel2: boolean;
  canReviewWarnings: boolean;
  canManagePausedVessels: boolean;
}

interface AppState {
  tasks: SimulationTask[];
  currentTask: SimulationTask | null;
  stats: DashboardStats | null;
  warnings: WarningRecord[];
  users: User[];
  cases: CaseProfile[];
  pausedVessels: PausedVesselRecord[];
  currentUser: User;
  permissions: Permissions;
  loading: boolean;
  setRole: (role: UserRole) => void;
  fetchTasks: () => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchWarnings: () => Promise<void>;
  fetchPausedVessels: () => Promise<void>;
  fetchAll: () => Promise<void>;
  createTask: (data: any) => Promise<SimulationTask>;
  startTask: (id: string) => Promise<void>;
  retryValidation: (id: string) => Promise<void>;
  reviewWarning: (id: string, data: any) => Promise<void>;
  submitApproval: (taskId: string, data: any) => Promise<void>;
  pushToSurgery: (taskId: string) => Promise<void>;
  resolvePausedVessel: (id: string, data: any) => Promise<void>;
}

const defaultPermissions: Permissions = {
  canApproveLevel1: false, canApproveLevel2: false, canReviewWarnings: true, canManagePausedVessels: false,
};

const initialUsers: User[] = [
  { id: 'u1', name: '张工程师', role: 'engineer', email: 'zhang.eng@hospital.com' },
  { id: 'u2', name: '李研究员', role: 'researcher', email: 'li.research@hospital.com' },
  { id: 'u3', name: '王主任', role: 'doctor', email: 'wang.dr@hospital.com' },
  { id: 'u4', name: '陈首席', role: 'chief_scientist', email: 'chen.chief@hospital.com' },
];

const roleMap: Record<UserRole, { user: User; perm: Permissions }> = {
  engineer: { user: initialUsers[0], perm: defaultPermissions },
  researcher: { user: initialUsers[1], perm: { ...defaultPermissions, canApproveLevel1: true, canReviewWarnings: false } },
  doctor: { user: initialUsers[2], perm: { ...defaultPermissions, canApproveLevel2: true, canReviewWarnings: false } },
  chief_scientist: { user: initialUsers[3], perm: { canApproveLevel1: true, canApproveLevel2: true, canReviewWarnings: true, canManagePausedVessels: true } },
};

export const useAppStore = create<AppState>((set, get) => ({
  tasks: [],
  currentTask: null,
  stats: null,
  warnings: [],
  users: initialUsers,
  cases: [],
  pausedVessels: [],
  currentUser: roleMap.engineer.user,
  permissions: roleMap.engineer.perm,
  loading: false,

  setRole: (role: UserRole) => {
    const r = roleMap[role] || roleMap.engineer;
    set({ currentUser: r.user, permissions: r.perm });
  },

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const tasks = await taskApi.list();
      set({ tasks, loading: false });
    } catch (e) { set({ loading: false }); }
  },

  fetchTask: async (id: string) => {
    set({ loading: true });
    try {
      const task = await taskApi.get(id);
      set({ currentTask: task, loading: false });
    } catch (e) { set({ loading: false }); }
  },

  fetchStats: async () => {
    try { const stats = await statsApi.daily(); set({ stats }); } catch (e) {}
  },

  fetchWarnings: async () => {
    try { const warnings = await warningApi.list(); set({ warnings }); } catch (e) {}
  },

  fetchPausedVessels: async () => {
    try { const pv = await pausedVesselApi.list(); set({ pausedVessels: pv }); } catch (e) {}
  },

  fetchAll: async () => {
    set({ loading: true });
    try {
      const [tasks, stats, warnings, users, cases, pv] = await Promise.all([
        taskApi.list(), statsApi.daily(), warningApi.list(), userApi.list(), caseApi.list(), pausedVesselApi.list(),
      ]);
      set({ tasks, stats, warnings, users, cases, pausedVessels: pv, loading: false });
    } catch (e) { set({ loading: false }); }
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

  retryValidation: async (id: string) => {
    const task = await taskApi.retryValidation(id);
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? task : t),
      currentTask: s.currentTask?.id === id ? task : s.currentTask,
    }));
  },

  reviewWarning: async (id: string, data: any) => {
    const { currentUser } = get();
    const task = await taskApi.review(id, { ...data, role: currentUser.role });
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? task : t),
      currentTask: s.currentTask?.id === id ? task : s.currentTask,
      warnings: s.warnings.filter(w => w.taskId !== id || data.reviewResult),
    }));
  },

  submitApproval: async (taskId: string, data: any) => {
    const { currentUser } = get();
    const task = await approvalApi.submit(taskId, { ...data, role: currentUser.role });
    set(s => ({
      tasks: s.tasks.map(t => t.id === taskId ? task : t),
      currentTask: s.currentTask?.id === taskId ? task : s.currentTask,
    }));
  },

  pushToSurgery: async (taskId: string) => {
    const { currentUser } = get();
    const task = await approvalApi.push(taskId, currentUser.role);
    set(s => ({
      tasks: s.tasks.map(t => t.id === taskId ? task : t),
      currentTask: s.currentTask?.id === taskId ? task : s.currentTask,
    }));
  },

  resolvePausedVessel: async (id: string, data: any) => {
    const { currentUser } = get();
    await pausedVesselApi.resolve(id, { ...data, role: currentUser.role, handledBy: currentUser.name });
    await Promise.all([get().fetchPausedVessels(), get().fetchTasks()]);
  },
}));
