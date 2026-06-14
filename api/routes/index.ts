import express from 'express';
import { tasks, warnings, approvals, dailyStats, users, cases, vesselLowStressCount } from '../data/mockDb';
import { SimulationTask, TaskStatus, WarningRecord, ApprovalRecord, StentRecommendation } from '../../shared/types';

const router = express.Router();

let _tasks = [...tasks];
let _warnings = [...warnings];
let _approvals = [...approvals];
let _vesselLowStressCount = { ...vesselLowStressCount };

const genId = () => Math.random().toString(36).slice(2, 10);

router.get('/tasks', (_req, res) => {
  res.json(_tasks);
});

router.get('/tasks/:id', (req, res) => {
  const task = _tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.post('/tasks', (req, res) => {
  const { caseName, patientName, vesselType, bloodParams, stressThreshold } = req.body;
  const paused = _vesselLowStressCount[vesselType] >= 3;
  const now = new Date().toISOString();
  const newTask: SimulationTask = {
    id: genId(),
    caseName,
    patientName,
    vesselType,
    status: paused ? 'error' : 'pending',
    progress: 0,
    bloodParams,
    createdAt: now,
    updatedAt: now,
    stressThreshold: stressThreshold || 1.5,
    lowStressCount: 0,
    vesselPaused: paused,
    warning: paused ? {
      id: genId(),
      taskId: '',
      type: 'low_stress',
      severity: 'critical',
      message: `血管【${vesselType}】已连续三次低应力超标，新任务已暂停，请联系首席科学家`,
    } : undefined,
  };
  if (paused) newTask.warning!.taskId = newTask.id;
  _tasks.unshift(newTask);
  res.status(201).json(newTask);
});

router.post('/tasks/:id/start', (req, res) => {
  const task = _tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.vesselPaused) return res.status(400).json({ error: '该血管已被暂停' });
  task.status = 'meshing';
  task.progress = 5;
  task.updatedAt = new Date().toISOString();
  simulateTaskProgress(task.id);
  res.json(task);
});

router.post('/tasks/:id/review', (req, res) => {
  const taskId = req.params.id;
  const { reviewResult, reviewer } = req.body;
  const task = _tasks.find(t => t.id === taskId);
  if (!task || !task.warning) return res.status(404).json({ error: 'Warning not found' });
  task.warning.reviewedBy = reviewer;
  task.warning.reviewedAt = new Date().toISOString();
  task.warning.reviewResult = reviewResult;

  if (reviewResult === 'approve_adjust') {
    task.lowStressCount += 1;
    _vesselLowStressCount[task.vesselType] = (_vesselLowStressCount[task.vesselType] || 0) + 1;
    if (task.currentStentConfig) {
      task.currentStentConfig = {
        ...task.currentStentConfig,
        diameter: +(task.currentStentConfig.diameter + 0.2).toFixed(1),
        length: task.currentStentConfig.length + 2,
      };
    }
    task.status = 'computing';
    task.progress = 50;
    task.updatedAt = new Date().toISOString();
    simulateTaskProgress(task.id);
  } else {
    task.status = 'error';
    task.updatedAt = new Date().toISOString();
  }
  res.json(task);
});

function simulateTaskProgress(taskId: string) {
  const stages: { status: TaskStatus; target: number }[] = [
    { status: 'meshing', target: 35 },
    { status: 'computing', target: 70 },
    { status: 'optimizing', target: 95 },
    { status: 'completed', target: 100 },
  ];
  let stageIdx = 0;
  const interval = setInterval(() => {
    const task = _tasks.find(t => t.id === taskId);
    if (!task) { clearInterval(interval); return; }
    if (task.status === 'error') { clearInterval(interval); return; }
    const current = stages[stageIdx];
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
        if (task.status === 'computing' && Math.random() > 0.6 && !task.warning) {
          task.warning = {
            id: genId(),
            taskId: task.id,
            type: 'low_stress',
            severity: 'warning',
            message: `检测到壁面剪切应力低于阈值 ${task.stressThreshold} Pa，请工程师复核`,
          };
          task.status = 'computing';
          clearInterval(interval);
        }
      }
    }
  }, 1500);
}

function generateRecommendations(task: SimulationTask): StentRecommendation[] {
  const base = task.currentStentConfig || { diameter: 3.0, length: 18, position: 50, meshDensity: 2 };
  return [
    { id: genId(), score: 90 + Math.floor(Math.random() * 8), config: base, avgStress: 2.5 + Math.random(), lowStressArea: 1 + Math.random() },
    { id: genId(), score: 82 + Math.floor(Math.random() * 6), config: { ...base, diameter: +(base.diameter + 0.3).toFixed(1), length: base.length + 3 }, avgStress: 2.3 + Math.random(), lowStressArea: 1.5 + Math.random() },
    { id: genId(), score: 76 + Math.floor(Math.random() * 5), config: { ...base, diameter: +(base.diameter - 0.2).toFixed(1), length: base.length - 2, meshDensity: 3 }, avgStress: 2.1 + Math.random(), lowStressArea: 2 + Math.random() },
  ];
}

router.get('/warnings', (_req, res) => {
  const all = _tasks.filter(t => t.warning).map(t => t.warning!);
  res.json(all);
});

router.get('/approvals', (_req, res) => {
  const pending = _tasks.filter(t => t.approvalStatus && t.approvalStatus !== 'level2_approved' && t.approvalStatus !== 'pushed_to_surgery');
  res.json(pending);
});

router.post('/approvals/:taskId', (req, res) => {
  const { taskId } = req.params;
  const { level, result, comment, reviewer } = req.body;
  const task = _tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const record: ApprovalRecord = {
    id: genId(),
    taskId,
    level,
    reviewer,
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
  const task = _tasks.find(t => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.approvalStatus !== 'level2_approved') return res.status(400).json({ error: '需完成二级审批后方可推送' });
  task.approvalStatus = 'pushed_to_surgery';
  task.updatedAt = new Date().toISOString();
  res.json(task);
});

router.get('/statistics/daily', (_req, res) => {
  res.json({
    todayTasks: _tasks.filter(t => t.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
    completionRate: Math.round(_tasks.filter(t => t.status === 'completed').length / _tasks.length * 100),
    avgStress: 2.7,
    optimizationCount: 97,
    pendingApprovals: _tasks.filter(t => t.approvalStatus === 'pending' || t.approvalStatus === 'level1_approved').length,
    activeWarnings: _tasks.filter(t => t.warning && !t.warning.reviewResult).length,
    trend: dailyStats,
  });
});

router.get('/users', (_req, res) => res.json(users));
router.get('/cases', (_req, res) => res.json(cases));

export default router;
