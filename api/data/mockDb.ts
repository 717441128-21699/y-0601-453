import { SimulationTask, User, CaseProfile, ApprovalRecord, WarningRecord, DailyStats } from '../../shared/types';

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000).toISOString();

export const users: User[] = [
  { id: 'u1', name: '张工程师', role: 'engineer', email: 'zhang.eng@hospital.com' },
  { id: 'u2', name: '李研究员', role: 'researcher', email: 'li.research@hospital.com' },
  { id: 'u3', name: '王主任', role: 'doctor', email: 'wang.dr@hospital.com' },
  { id: 'u4', name: '陈首席', role: 'chief_scientist', email: 'chen.chief@hospital.com' },
];

export const cases: CaseProfile[] = [
  { id: 'c1', patientName: '患者A', vesselType: '冠状动脉左前降支', geometryFile: 'LAD_patientA.stl', createdAt: daysAgo(10) },
  { id: 'c2', patientName: '患者B', vesselType: '冠状动脉右主干', geometryFile: 'RCA_patientB.stl', createdAt: daysAgo(7) },
  { id: 'c3', patientName: '患者C', vesselType: '颈动脉', geometryFile: 'Carotid_patientC.stl', createdAt: daysAgo(3) },
  { id: 'c4', patientName: '患者D', vesselType: '冠状动脉左回旋支', geometryFile: 'LCX_patientD.stl', createdAt: daysAgo(1) },
];

export const tasks: SimulationTask[] = [
  {
    id: 't1',
    caseName: 'LAD-2026-001',
    patientName: '患者A',
    vesselType: '冠状动脉左前降支',
    status: 'completed',
    progress: 100,
    bloodParams: { viscosity: 3.5, density: 1060, flowRate: 85 },
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(26),
    stressThreshold: 1.5,
    lowStressCount: 0,
    currentStentConfig: { diameter: 3.0, length: 18, position: 45, meshDensity: 2 },
    recommendedStents: [
      { id: 's1', score: 92, config: { diameter: 3.0, length: 18, position: 45, meshDensity: 2 }, avgStress: 2.8, lowStressArea: 1.2 },
      { id: 's2', score: 87, config: { diameter: 3.5, length: 22, position: 42, meshDensity: 2 }, avgStress: 2.5, lowStressArea: 2.1 },
      { id: 's3', score: 81, config: { diameter: 2.8, length: 15, position: 48, meshDensity: 3 }, avgStress: 2.3, lowStressArea: 3.5 },
    ],
    approvalStatus: 'level2_approved',
    approvals: [
      { id: 'a1', taskId: 't1', level: 1, reviewer: '李研究员', result: 'approved', comment: '血流模拟结果可信，支架方案合理', createdAt: daysAgo(4) },
      { id: 'a2', taskId: 't1', level: 2, reviewer: '王主任', result: 'approved', comment: '同意推荐方案，可推送手术规划', createdAt: daysAgo(3) },
    ],
  },
  {
    id: 't2',
    caseName: 'RCA-2026-002',
    patientName: '患者B',
    vesselType: '冠状动脉右主干',
    status: 'computing',
    progress: 62,
    bloodParams: { viscosity: 4.0, density: 1065, flowRate: 92 },
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(2),
    stressThreshold: 1.5,
    lowStressCount: 1,
    currentStentConfig: { diameter: 3.5, length: 24, position: 38, meshDensity: 2 },
  },
  {
    id: 't3',
    caseName: 'Carotid-2026-003',
    patientName: '患者C',
    vesselType: '颈动脉',
    status: 'optimizing',
    progress: 85,
    bloodParams: { viscosity: 3.8, density: 1058, flowRate: 120 },
    createdAt: hoursAgo(15),
    updatedAt: hoursAgo(4),
    stressThreshold: 1.2,
    lowStressCount: 2,
    warning: {
      id: 'w1',
      taskId: 't3',
      type: 'low_stress',
      severity: 'warning',
      message: '支架近端检测到低壁面剪切应力区域(0.98 Pa)，低于阈值1.2 Pa，建议复核',
    },
    currentStentConfig: { diameter: 6.0, length: 30, position: 50, meshDensity: 2 },
  },
  {
    id: 't4',
    caseName: 'LCX-2026-004',
    patientName: '患者D',
    vesselType: '冠状动脉左回旋支',
    status: 'meshing',
    progress: 28,
    bloodParams: { viscosity: 3.2, density: 1055, flowRate: 78 },
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(1),
    stressThreshold: 1.5,
    lowStressCount: 0,
  },
  {
    id: 't5',
    caseName: 'LAD-2026-005',
    patientName: '患者E',
    vesselType: '冠状动脉左前降支',
    status: 'pending',
    progress: 0,
    bloodParams: { viscosity: 3.6, density: 1062, flowRate: 88 },
    createdAt: hoursAgo(0.5),
    updatedAt: hoursAgo(0.5),
    stressThreshold: 1.5,
    lowStressCount: 0,
    vesselPaused: false,
  },
  {
    id: 't6',
    caseName: 'LAD-2026-006',
    patientName: '患者F',
    vesselType: '冠状动脉左前降支',
    status: 'error',
    progress: 45,
    bloodParams: { viscosity: 3.7, density: 1063, flowRate: 90 },
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    stressThreshold: 1.5,
    lowStressCount: 3,
    vesselPaused: true,
    warning: {
      id: 'w2',
      taskId: 't6',
      type: 'low_stress',
      severity: 'critical',
      message: '同血管(冠状动脉左前降支)连续三次低应力区超标，已暂停该血管新任务，需首席科学家介入',
    },
  },
];

export const warnings: WarningRecord[] = tasks.filter(t => t.warning).map(t => t.warning!);

export const approvals: ApprovalRecord[] = tasks.flatMap(t => t.approvals || []);

export const dailyStats: DailyStats[] = [
  { date: daysAgo(6).split('T')[0], completionRate: 78, avgStress: 2.6, optimizationCount: 12, taskCount: 9 },
  { date: daysAgo(5).split('T')[0], completionRate: 82, avgStress: 2.7, optimizationCount: 15, taskCount: 11 },
  { date: daysAgo(4).split('T')[0], completionRate: 75, avgStress: 2.5, optimizationCount: 10, taskCount: 8 },
  { date: daysAgo(3).split('T')[0], completionRate: 88, avgStress: 2.9, optimizationCount: 18, taskCount: 13 },
  { date: daysAgo(2).split('T')[0], completionRate: 85, avgStress: 2.8, optimizationCount: 14, taskCount: 10 },
  { date: daysAgo(1).split('T')[0], completionRate: 90, avgStress: 3.0, optimizationCount: 20, taskCount: 15 },
  { date: now.toISOString().split('T')[0], completionRate: 67, avgStress: 2.7, optimizationCount: 8, taskCount: 6 },
];

export const vesselLowStressCount: Record<string, number> = {
  '冠状动脉左前降支': 3,
  '冠状动脉右主干': 1,
  '颈动脉': 2,
  '冠状动脉左回旋支': 0,
};
