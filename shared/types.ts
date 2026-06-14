export type TaskStatus = 'pending' | 'meshing' | 'computing' | 'optimizing' | 'completed' | 'error';
export type UserRole = 'engineer' | 'researcher' | 'doctor' | 'chief_scientist';
export type ApprovalStatus = 'pending' | 'level1_approved' | 'level2_approved' | 'rejected' | 'pushed_to_surgery';
export type WarningType = 'low_stress';
export type WarningSeverity = 'warning' | 'critical';

export interface BloodParams {
  viscosity: number;
  density: number;
  flowRate: number;
}

export interface StentConfig {
  diameter: number;
  length: number;
  position: number;
  meshDensity: number;
}

export interface StentRecommendation {
  id: string;
  score: number;
  config: StentConfig;
  avgStress: number;
  lowStressArea: number;
}

export interface WarningRecord {
  id: string;
  taskId: string;
  type: WarningType;
  severity: WarningSeverity;
  message: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewResult?: 'approve_adjust' | 'reject';
}

export interface ApprovalRecord {
  id: string;
  taskId: string;
  level: 1 | 2;
  reviewer: string;
  result: 'approved' | 'rejected';
  comment: string;
  createdAt: string;
}

export interface SimulationTask {
  id: string;
  caseName: string;
  patientName: string;
  vesselType: string;
  status: TaskStatus;
  progress: number;
  bloodParams: BloodParams;
  createdAt: string;
  updatedAt: string;
  stressThreshold: number;
  lowStressCount: number;
  currentStentConfig?: StentConfig;
  recommendedStents?: StentRecommendation[];
  warning?: WarningRecord;
  approvalStatus?: ApprovalStatus;
  approvals?: ApprovalRecord[];
  vesselPaused?: boolean;
}

export interface CaseProfile {
  id: string;
  patientName: string;
  vesselType: string;
  geometryFile: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
}

export interface DailyStats {
  date: string;
  completionRate: number;
  avgStress: number;
  optimizationCount: number;
  taskCount: number;
}

export interface DashboardStats {
  todayTasks: number;
  completionRate: number;
  avgStress: number;
  optimizationCount: number;
  pendingApprovals: number;
  activeWarnings: number;
  trend: DailyStats[];
}
