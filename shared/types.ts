export type TaskStatus = 'pending' | 'meshing' | 'computing' | 'optimizing' | 'completed' | 'error';
export type UserRole = 'engineer' | 'researcher' | 'doctor' | 'chief_scientist';
export type ApprovalStatus = 'pending' | 'level1_approved' | 'level2_approved' | 'rejected' | 'pushed_to_surgery';
export type WarningType = 'low_stress';
export type WarningSeverity = 'warning' | 'critical';

export interface ValidationFailure {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface GeometryFileInfo {
  name: string;
  sizeBytes: number;
  format: 'stl' | 'obj' | 'step' | 'iges' | 'igs' | 'unknown';
  valid?: boolean;
  message?: string;
  uploadedAt?: string;
  checksum?: string;
  vertexCount?: number;
  faceCount?: number;
}

export interface StentAdjustment {
  id: string;
  taskId: string;
  timestamp: string;
  operator: string;
  before: StentConfig;
  after: StentConfig;
  reason: string;
  comment?: string;
}

export interface BloodParams {
  viscosity: number;
  density: number;
  flowRate: number;
}

export interface StentConfig {
  diameter: number;
  length: number;
  position: number;
  meshDensity?: number;
  expansionPressure?: number;
}

export interface StentRecommendation {
  id: string;
  score: number;
  config: StentConfig;
  avgStress?: number;
  avgStressPa?: number;
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
  createdAt?: string;
  details?: {
    lowStressArea?: number;
    minStress?: number;
    region?: string;
  };
}

export interface ApprovalRecord {
  id: string;
  taskId: string;
  level: 1 | 2;
  reviewer: string;
  reviewerRole: UserRole;
  result: 'approved' | 'rejected';
  comment: string;
  createdAt: string;
  timestamp?: string;
}

export interface PausedVesselRecord {
  id: string;
  vesselType: string;
  triggerTaskId: string;
  lowStressCount: number;
  offenseCount?: number;
  relatedTaskIds?: string[];
  suspendedAt?: string;
  pausedAt: string;
  handledBy?: string;
  handledAt?: string;
  resolution?: string;
  recommendedResolution?: string;
  status: 'pending' | 'resolved';
}

export interface StressResult {
  maxStressPa?: number;
  maxStress?: number;
  minStressPa?: number;
  avgStressPa?: number;
  lowStressArea?: number;
  recommended?: StentRecommendation;
  alternatives?: StentRecommendation[];
}

export interface SimulationTask {
  id: string;
  caseName: string;
  patientName: string;
  vesselType: string;
  status: TaskStatus;
  progress: number;
  bloodParams: BloodParams;
  geometryFile?: GeometryFileInfo;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  stressThreshold: number;
  lowStressCount: number;
  validationErrors?: ValidationFailure[];
  currentStentConfig?: StentConfig;
  currentStent?: StentConfig;
  recommendedStents?: StentRecommendation[];
  stressResult?: StressResult;
  warning?: WarningRecord;
  warnings?: WarningRecord[];
  approvalStatus?: ApprovalStatus;
  approvals?: ApprovalRecord[];
  surgeryPushed?: boolean;
  surgeryPushedAt?: string;
  stentAdjustments?: StentAdjustment[];
  vesselPaused?: boolean;
  recomputeInProgress?: boolean;
  recomputeProgress?: number;
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
  avgWSSPa?: number;
  optimizationCount: number;
  taskCount: number;
}

export interface DashboardStats {
  todayTasks: number;
  completionRate: number;
  avgStress: number;
  avgWSSPa?: number;
  optimizationCount: number;
  pendingApprovals: number;
  activeWarnings: number;
  pausedVesselCount: number;
  trend: DailyStats[];
}
