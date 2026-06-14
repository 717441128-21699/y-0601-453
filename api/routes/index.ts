import express from 'express';
import { tasks as initialTasks, warnings, approvals, dailyStats, users, cases, vesselLowStressCount as initialVesselCount, pausedVessels as initialPaused, stentAdjustments as initialAdjustments } from '../data/mockDb';
import { SimulationTask, TaskStatus, WarningRecord, ApprovalRecord, StentRecommendation, ValidationFailure, GeometryFileInfo, UserRole, StentAdjustment, PausedVesselRecord } from '../../shared/types';

const router = express.Router();

let _tasks: SimulationTask[] = JSON.parse(JSON.stringify(initialTasks));
let _warnings = [...warnings];
let _approvals = [...approvals];
let _vesselLowStressCount: Record<string, number> = { ...initialVesselCount };
let _pausedVessels: PausedVesselRecord[] = JSON.parse(JSON.stringify(initialPaused));
let _stentAdjustments: StentAdjustment[] = [...initialAdjustments];

const genId = () => Math.random().toString(36).slice(2, 10);

const ROLE_PERMISSIONS: Record<UserRole, { canApproveLevel1: boolean; canApproveLevel2: boolean; canReviewWarnings: boolean; canManagePausedVessels: boolean }> = {
  engineer: { canApproveLevel1: false, canApproveLevel2: false, canReviewWarnings: true, canManagePausedVessels: false },
  researcher: { canApproveLevel1: true, canApproveLevel2: false, canReviewWarnings: false, canManagePausedVessels: false },
  doctor: { canApproveLevel1: false, canApproveLevel2: true, canReviewWarnings: false, canManagePausedVessels: false },
  chief_scientist: { canApproveLevel1: true, canApproveLevel2: true, canReviewWarnings: true, canManagePausedVessels: true },
};

function validateGeometryFile(file?: GeometryFileInfo): ValidationFailure[] {
  const errs: ValidationFailure[] = [];
  if (!file) {
    errs.push({ field: 'geometryFile', message: '未上传血管几何文件(STL/OBJ/STEP)', severity: 'error' });
    return errs;
  }
  const validFormats = ['stl', 'obj', 'step'];
  if (!validFormats.includes(file.format)) {
    errs.push({ field: 'geometryFile', message: `不支持的文件格式 .${file.format}，请上传 .stl/.obj/.step 文件`, severity: 'error' });
  }
  if (file.sizeBytes < 100_000) {
    errs.push({ field: 'geometryFile', message: `文件过小 (${(file.sizeBytes / 1024).toFixed(0)} KB)，疑似非有效血管三维模型`, severity: 'warning' });
  }
  if (file.sizeBytes > 100 * 1024 * 1024) {
    errs.push({ field: 'geometryFile', message: `文件过大 (${(file.sizeBytes / 1024 / 1024).toFixed(1)} MB)，超出 100MB 上限`, severity: 'error' });
  }
  if (!file.valid) {
    errs.push({ field: 'geometryFile', message: file.message || '文件校验失败', severity: 'error' });
  }
  return errs;
}

function validateBloodParams(bp: { viscosity: number; density: number; flowRate: number }): ValidationFailure[] {
  const errs: ValidationFailure[] = [];
  if (bp.viscosity < 2.0 || bp.viscosity > 6.0) {
    errs.push({ field: 'viscosity', message: `血液粘度 ${bp.viscosity} cP 超出合理范围 (2.0-6.0 cP)`, severity: 'error' });
  }
  if (bp.density < 1030 || bp.density > 1090) {
    errs.push({ field: 'density', message: `血液密度 ${bp.density} kg/m³ 超出合理范围 (1030-1090 kg/m³)`, severity: 'error' });
  }
  if (bp.flowRate < 10 || bp.flowRate > 300) {
    errs.push({ field: 'flowRate', message: `入口流量 ${bp.flowRate} mL/s 超出合理范围 (10-300 mL/s)`, severity: 'error' });
  }
  return errs;
}

function validateStressThreshold(v: number): ValidationFailure[] {
  const errs: ValidationFailure[] = [];
  if (v < 0.5 || v > 3.0) {
    errs.push({ field: 'stressThreshold', message: `应力阈值 ${v} Pa 超出合理范围 (0.5-3.0 Pa)，可能导致误判`, severity: 'warning' });
  }
  return errs;
}

function validateBasicInfo(caseName: string, patientName: string): ValidationFailure[] {
  const errs: ValidationFailure[] = [];
  if (!caseName || caseName.trim().length < 3) {
    errs.push({ field: 'caseName', message: `病例编号/名称过短 ("${caseName}")，至少 3 个字符`, severity: 'error' });
  }
  if (!patientName || patientName.trim().length < 2) {
    errs.push({ field: 'patientName', message: '患者姓名不能为空', severity: 'error' });
  }
  return errs;
}

router.get('/tasks', (_req, res) => {
  res.json(_tasks);
});

router.get('/tasks/:id', (req, res) => {
  const task = _tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.post('/tasks', (req, res) => {
  const { caseName, patientName, vesselType, bloodParams, stressThreshold, geometryFile } = req.body;

  const validationErrors: ValidationFailure[] = [
    ...validateBasicInfo(caseName || '', patientName || ''),
    ...validateGeometryFile(geometryFile),
    ...validateBloodParams(bloodParams || { viscosity: 0, density: 0, flowRate: 0 }),
    ...validateStressThreshold(stressThreshold || 0),
  ];

  const pausedRecord = _pausedVessels.find(p => p.vesselType === vesselType && p.status === 'pending');
  if (pausedRecord) {
    validationErrors.push({
      field: 'vesselType',
      message: `血管【${vesselType}】已连续三次低应力超标，新任务已自动暂停，需首席科学家介入处理`,
      severity: 'error',
    });
  }

  const hasErrors = validationErrors.some(e => e.severity === 'error');
  const now = new Date().toISOString();
  const newTask: SimulationTask = {
    id: genId(),
    caseName: caseName || '未命名',
    patientName: patientName || '未命名',
    vesselType: vesselType || '未知血管',
    status: hasErrors || pausedRecord ? 'pending' : 'pending',
    progress: 0,
    bloodParams: bloodParams || { viscosity: 3.5, density: 1060, flowRate: 85 },
    geometryFile,
    createdAt: now,
    updatedAt: now,
    stressThreshold: stressThreshold || 1.5,
    lowStressCount: 0,
    validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    vesselPaused: !!pausedRecord,
  };

  if (!hasErrors && !pausedRecord) {
    setTimeout(() => {
      const t = _tasks.find(x => x.id === newTask.id);
      if (t) {
        t.status = 'meshing';
        t.progress = 5;
        t.updatedAt = new Date().toISOString();
        simulateTaskProgress(t.id);
      }
    }, 800);
  }

  _tasks.unshift(newTask);
  res.status(201).json(newTask);
});

router.post('/tasks/:id/retry-validation', (req, res) => {
  const task = _tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const errs: ValidationFailure[] = [
    ...validateBasicInfo(task.caseName, task.patientName),
    ...validateGeometryFile(task.geometryFile),
    ...validateBloodParams(task.bloodParams),
    ...validateStressThreshold(task.stressThreshold),
  ];
  const pausedRecord = _pausedVessels.find(p => p.vesselType === task.vesselType && p.status === 'pending');
  if (pausedRecord) {
    errs.push({ field: 'vesselType', message: `血管【${task.vesselType}】仍处于暂停状态，需首席科学家先解除`, severity: 'error' });
  }
  task.validationErrors = errs.length > 0 ? errs : undefined;
  task.vesselPaused = !!pausedRecord;
  task.updatedAt = new Date().toISOString();
  if (errs.length === 0) {
    task.status = 'meshing';
    task.progress = 5;
    simulateTaskProgress(task.id);
  }
  res.json(task);
});

router.post('/tasks/:id/start', (req, res) => {
  const task = _tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.vesselPaused) return res.status(400).json({ error: '该血管已被暂停，请联系首席科学家' });
  if (task.validationErrors?.some(e => e.severity === 'error')) {
    return res.status(400).json({ error: '任务存在校验错误，请先修正后重试' });
  }
  task.status = 'meshing';
  task.progress = 5;
  task.updatedAt = new Date().toISOString();
  simulateTaskProgress(task.id);
  res.json(task);
});

router.post('/tasks/:id/review', (req, res) => {
  const taskId = req.params.id;
  const { reviewResult, reviewer, role, comment } = req.body;
  const perm = ROLE_PERMISSIONS[role as UserRole] || ROLE_PERMISSIONS.engineer;
  if (!perm.canReviewWarnings) return res.status(403).json({ error: '当前角色无权限进行预警复核' });

  const task = _tasks.find(t => t.id === taskId);
  if (!task || !task.warning) return res.status(404).json({ error: 'Warning not found' });
  task.warning.reviewedBy = reviewer;
  task.warning.reviewedAt = new Date().toISOString();
  task.warning.reviewResult = reviewResult;
  if (!task.warnings) task.warnings = [];
  if (!task.warnings.find(w => w.id === task.warning!.id)) task.warnings.push(task.warning);
  else {
    const idx = task.warnings.findIndex(w => w.id === task.warning!.id);
    if (idx >= 0) task.warnings[idx] = { ...task.warning };
  }

  if (reviewResult === 'approve_adjust') {
    const before = { ...task.currentStentConfig! };
    const after: typeof before = {
      ...before,
      diameter: +(before.diameter + 0.2).toFixed(1),
      length: before.length + 2,
    };
    task.lowStressCount += 1;
    _vesselLowStressCount[task.vesselType] = (_vesselLowStressCount[task.vesselType] || 0) + 1;
    task.currentStentConfig = after;

    const adjustment: StentAdjustment = {
      id: genId(),
      taskId,
      timestamp: new Date().toISOString(),
      operator: reviewer,
      before,
      after,
      reason: comment || '工程师复核通过，自动调整支架几何参数',
    };
    _stentAdjustments.push(adjustment);
    if (!task.stentAdjustments) task.stentAdjustments = [];
    task.stentAdjustments.push(adjustment);

    if (_vesselLowStressCount[task.vesselType] >= 3) {
      const existing = _pausedVessels.find(p => p.vesselType === task.vesselType);
      if (!existing) {
        const relatedIds = _tasks.filter(t => t.vesselType === task.vesselType).map(t => t.id);
        _pausedVessels.push({
          id: genId(),
          vesselType: task.vesselType,
          triggerTaskId: taskId,
          lowStressCount: _vesselLowStressCount[task.vesselType],
          offenseCount: _vesselLowStressCount[task.vesselType],
          pausedAt: new Date().toISOString(),
          suspendedAt: new Date().toISOString(),
          status: 'pending',
          relatedTaskIds: relatedIds,
          recommendedResolution: '建议对该血管段支架参数进行优化，使用长支架+扩张策略',
        });
        task.warning = {
          id: genId(),
          taskId,
          type: 'low_stress',
          severity: 'critical',
          message: `同血管(${task.vesselType})已连续三次低应力区超标，已自动暂停该血管新任务，请通知首席科学家介入`,
        };
      }
    }

    task.recomputeInProgress = true;
    task.recomputeProgress = 0;
    task.status = 'computing';
    task.progress = 50;
    task.updatedAt = new Date().toISOString();
    simulateRecompute(task.id);
  } else {
    task.status = 'error';
    task.updatedAt = new Date().toISOString();
  }
  res.json(task);
});

function simulateRecompute(taskId: string) {
  let p = 0;
  const itv = setInterval(() => {
    const t = _tasks.find(x => x.id === taskId);
    if (!t) { clearInterval(itv); return; }
    p += 4;
    t.recomputeProgress = Math.min(p, 100);
    if (p >= 100) {
      t.recomputeInProgress = false;
      t.progress = 70;
      t.status = 'optimizing';
      t.updatedAt = new Date().toISOString();
      clearInterval(itv);
      simulateTaskProgress(taskId);
    }
  }, 350);
}

router.get('/tasks/:id/adjustments', (req, res) => {
  const list = _stentAdjustments.filter(a => a.taskId === req.params.id);
  res.json(list);
});

function simulateTaskProgress(taskId: string) {
  const stages: { status: TaskStatus; target: number }[] = [
    { status: 'meshing', target: 35 },
    { status: 'computing', target: 70 },
    { status: 'optimizing', target: 95 },
    { status: 'completed', target: 100 },
  ];
  let stageIdx = 0;
  const currentTask = _tasks.find(t => t.id === taskId);
  if (!currentTask) return;
  for (let i = 0; i < stages.length; i++) {
    if (currentTask.status === stages[i].status) { stageIdx = i; break; }
    if (i < stages.length - 1 && currentTask.progress < stages[i].target) { stageIdx = i; break; }
    if (i === stages.length - 1) stageIdx = i;
  }
  const interval = setInterval(() => {
    const task = _tasks.find(t => t.id === taskId);
    if (!task) { clearInterval(interval); return; }
    if (task.status === 'error') { clearInterval(interval); return; }
    if (task.recomputeInProgress) { return; }
    const current = stages[stageIdx];
    if (!current) { clearInterval(interval); return; }
    if (task.progress < current.target) {
      task.progress = Math.min(task.progress + 3, current.target);
      task.updatedAt = new Date().toISOString();
    } else {
      stageIdx++;
      if (stageIdx >= stages.length) {
        task.status = 'completed';
        task.progress = 100;
        task.recommendedStents = generateRecommendations(task);
        task.approvalStatus = 'pending';
        task.updatedAt = new Date().toISOString();
        clearInterval(interval);
      } else {
        task.status = stages[stageIdx].status;
        if (task.status === 'computing' && !task.warning && Math.random() > 0.65) {
          task.warning = {
            id: genId(),
            taskId: task.id,
            type: 'low_stress',
            severity: 'warning',
            message: `检测到壁面剪切应力低于阈值 ${task.stressThreshold} Pa，请工程师复核`,
            createdAt: new Date().toISOString(),
            details: {
              lowStressArea: +(5 + Math.random() * 15).toFixed(1),
              minStress: +(0.3 + Math.random() * 0.5).toFixed(3),
            },
          };
          if (!task.warnings) task.warnings = [];
          task.warnings.push(task.warning);
          clearInterval(interval);
        }
      }
    }
  }, 1500);
}

function generateRecommendations(task: SimulationTask): StentRecommendation[] {
  const base = task.currentStentConfig || { diameter: 3.0, length: 18, position: 50, meshDensity: 2 };
  return [
    { id: genId(), score: Math.min(98, 88 + Math.floor(Math.random() * 10)), config: base, avgStress: +(2.4 + Math.random() * 0.8).toFixed(2), lowStressArea: +(0.8 + Math.random() * 1.2).toFixed(2) },
    { id: genId(), score: Math.min(95, 80 + Math.floor(Math.random() * 8)), config: { ...base, diameter: +(base.diameter + 0.3).toFixed(1), length: base.length + 3 }, avgStress: +(2.2 + Math.random() * 0.7).toFixed(2), lowStressArea: +(1.4 + Math.random() * 1.2).toFixed(2) },
    { id: genId(), score: Math.min(92, 74 + Math.floor(Math.random() * 6)), config: { ...base, diameter: +(Math.max(1.5, base.diameter - 0.2)).toFixed(1), length: Math.max(8, base.length - 2), meshDensity: 3 }, avgStress: +(2.0 + Math.random() * 0.6).toFixed(2), lowStressArea: +(1.8 + Math.random() * 1.5).toFixed(2) },
  ];
}

router.get('/warnings', (_req, res) => {
  const all = _tasks.filter(t => t.warning).map(t => t.warning!);
  res.json(all);
});

router.get('/approvals', (_req, res) => {
  const pending = _tasks.filter(t =>
    t.status === 'completed' &&
    t.approvalStatus &&
    t.approvalStatus !== 'pushed_to_surgery' &&
    t.approvalStatus !== 'rejected'
  );
  res.json(pending);
});

router.post('/approvals/:taskId', (req, res) => {
  const taskId = req.params.taskId;
  const { level, result, comment, reviewer, role } = req.body;
  const userRole = role as UserRole;
  const perm = ROLE_PERMISSIONS[userRole];
  if (!perm) return res.status(403).json({ error: '未知角色' });

  if (level === 1 && !perm.canApproveLevel1) {
    return res.status(403).json({ error: '当前角色无权限进行一级审批(需生物力学研究员或首席科学家)' });
  }
  if (level === 2 && !perm.canApproveLevel2) {
    return res.status(403).json({ error: '当前角色无权限进行二级审批(需主任医师或首席科学家)' });
  }

  const task = _tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (level === 1 && task.approvalStatus !== 'pending' && task.approvalStatus !== 'rejected') {
    return res.status(400).json({ error: '当前任务状态不允许进行一级审批' });
  }
  if (level === 2 && task.approvalStatus !== 'level1_approved') {
    return res.status(400).json({ error: '需先完成一级审批后方可进行二级审批' });
  }

  const record: ApprovalRecord = {
    id: genId(),
    taskId,
    level,
    reviewer,
    reviewerRole: userRole,
    result,
    comment,
    createdAt: new Date().toISOString(),
  };
  if (!task.approvals) task.approvals = [];
  task.approvals.push(record);
  if (result === 'rejected') {
    task.approvalStatus = 'rejected';
  } else if (level === 1) {
    task.approvalStatus = 'level1_approved';
  } else if (level === 2) {
    task.approvalStatus = 'level2_approved';
  }
  task.updatedAt = new Date().toISOString();
  res.json(task);
});

router.post('/approvals/:taskId/push', (req, res) => {
  const { role } = req.body;
  const perm = ROLE_PERMISSIONS[role as UserRole];
  if (!perm || !perm.canApproveLevel2) {
    return res.status(403).json({ error: '仅主任医师或首席科学家可推送至手术规划' });
  }
  const task = _tasks.find(t => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.approvalStatus !== 'level2_approved') return res.status(400).json({ error: '需完成二级审批后方可推送' });
  task.approvalStatus = 'pushed_to_surgery';
  task.surgeryPushed = true;
  task.surgeryPushedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();
  res.json(task);
});

router.get('/paused-vessels', (_req, res) => {
  const list = _pausedVessels.map(p => ({
    ...p,
    offenseCount: p.offenseCount ?? p.lowStressCount ?? 3,
    suspendedAt: p.suspendedAt ?? p.pausedAt,
    relatedTaskIds: p.relatedTaskIds ?? _tasks.filter(t => t.vesselType === p.vesselType).map(t => t.id),
  }));
  res.json(list);
});

router.post('/paused-vessels/:id/resolve', (req, res) => {
  const { role, handledBy, resolution, allowNewTasks } = req.body;
  const perm = ROLE_PERMISSIONS[role as UserRole];
  if (!perm || !perm.canManagePausedVessels) return res.status(403).json({ error: '仅首席科学家可处理暂停血管' });
  const pv = _pausedVessels.find(p => p.id === req.params.id);
  if (!pv) return res.status(404).json({ error: 'Paused vessel not found' });
  pv.status = 'resolved';
  pv.handledBy = handledBy;
  pv.handledAt = new Date().toISOString();
  pv.resolution = resolution || '首席科学家确认解除暂停';
  if (allowNewTasks) {
    _vesselLowStressCount[pv.vesselType] = 0;
    _tasks.forEach(t => {
      if (t.vesselType === pv.vesselType && t.status === 'pending') {
        t.vesselPaused = false;
        t.validationErrors = (t.validationErrors || []).filter(e => e.field !== 'vesselType');
        if ((t.validationErrors?.length || 0) === 0) delete t.validationErrors;
        if ((t.validationErrors?.filter(e => e.severity === 'error').length || 0) === 0) {
          t.status = 'meshing';
          t.progress = 5;
          t.updatedAt = new Date().toISOString();
          simulateTaskProgress(t.id);
        }
      }
    });
  }
  res.json(pv);
});

router.get('/statistics/daily', (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = _tasks.filter(t => t.createdAt.slice(0, 10) === today);
  const completedTasks = _tasks.filter(t => t.status === 'completed');
  const total = _tasks.length;
  const completionRate = total === 0 ? 0 : Math.round(completedTasks.length / total * 100);

  const allAdjustments = _stentAdjustments.length;
  const optimizationCount = completedTasks.reduce((s, t) => s + (t.lowStressCount || 0) + (t.recommendedStents?.length || 0), 0) + allAdjustments;

  const avgStress = completedTasks.length === 0 ? 2.7 : completedTasks.reduce((s, t) => {
    const recs = t.recommendedStents || [];
    return s + (recs.length === 0 ? 0 : recs.reduce((a, b) => a + b.avgStress, 0) / recs.length);
  }, 0) / completedTasks.length;

  const pendingApprovals = _tasks.filter(t =>
    t.status === 'completed' &&
    t.approvalStatus &&
    t.approvalStatus !== 'level2_approved' &&
    t.approvalStatus !== 'pushed_to_surgery' &&
    t.approvalStatus !== 'rejected'
  ).length;

  const activeWarnings = _tasks.filter(t => t.warning && !t.warning.reviewResult).length;
  const pausedVesselCount = _pausedVessels.filter(p => p.status === 'pending').length;

  const latest: typeof dailyStats[number] = {
    date: today,
    completionRate,
    avgStress: +avgStress.toFixed(2),
    optimizationCount,
    taskCount: todayTasks.length,
  };
  const trend = [...dailyStats.slice(0, -1), latest];

  res.json({
    todayTasks: todayTasks.length,
    completionRate,
    avgStress: +avgStress.toFixed(2),
    avgWSSPa: +avgStress.toFixed(2),
    optimizationCount,
    pendingApprovals,
    activeWarnings,
    pausedVesselCount,
    pushedToSurgeryCount: _tasks.filter(t => t.surgeryPushed || t.approvalStatus === 'pushed_to_surgery').length,
    trend,
  });
});

router.get('/role-permissions', (req, res) => {
  const role = (req.query.role as UserRole) || 'engineer';
  res.json({ role, permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.engineer });
});

router.get('/users', (_req, res) => res.json(users));
router.get('/cases', (_req, res) => res.json(cases));
router.get('/adjustments', (_req, res) => res.json(_stentAdjustments));

export default router;
