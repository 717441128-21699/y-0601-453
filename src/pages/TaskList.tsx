import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Play, AlertTriangle, Activity, Clock, ChevronRight, Upload, Droplets, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SimulationTask, TaskStatus } from '../../shared/types';

export default function TaskList() {
  const { tasks, fetchTasks, createTask, startTask, loading } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const filtered = tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (keyword && !t.caseName.includes(keyword) && !t.patientName.includes(keyword)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">任务管理</h2>
          <p className="text-gray-400 text-sm mt-1">创建与监控血流动力学模拟任务</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-medical-cyan to-medical-cyan-dark text-space-deep font-semibold shadow-glow-cyan hover:shadow-glow-cyan hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" />
          新建模拟任务
        </button>
      </div>

      <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索病例名称、患者姓名..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-space-dark border border-medical-cyan/10 text-white text-sm focus:outline-none focus:border-medical-cyan/40 placeholder-gray-500"
          />
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-space-dark border border-medical-cyan/10">
          <Filter className="w-4 h-4 text-gray-400 ml-2" />
          {(['all', 'pending', 'meshing', 'computing', 'optimizing', 'completed', 'error'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === s ? 'bg-medical-cyan/20 text-medical-cyan' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {s === 'all' ? '全部' :
               s === 'pending' ? '待校验' :
               s === 'meshing' ? '网格生成' :
               s === 'computing' ? '血流计算' :
               s === 'optimizing' ? '支架优化' :
               s === 'completed' ? '已完成' : '异常'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map(task => (
          <TaskCard key={task.id} task={task} onStart={() => startTask(task.id)} />
        ))}
        {filtered.length === 0 && (
          <div className="glass-card rounded-2xl p-16 text-center">
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">暂无匹配的任务</p>
          </div>
        )}
      </div>

      {showModal && <NewTaskModal onClose={() => setShowModal(false)} onCreate={async (data) => {
        const task = await createTask(data);
        setShowModal(false);
        if (!task.vesselPaused) await startTask(task.id);
      }} />}
    </div>
  );
}

function TaskCard({ task, onStart }: { task: SimulationTask; onStart: () => void }) {
  const canStart = task.status === 'pending' && !task.vesselPaused;
  const hasWarning = task.warning && !task.warning.reviewResult;

  return (
    <div className="glass-card rounded-2xl p-5 hover:border-medical-cyan/30 transition-all group">
      <div className="flex items-start gap-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          task.status === 'completed' ? 'bg-emerald-500/15 border border-emerald-500/30' :
          task.status === 'error' ? 'bg-red-500/15 border border-red-500/30' :
          'bg-medical-cyan/10 border border-medical-cyan/20'
        } ${task.status === 'computing' || task.status === 'meshing' || task.status === 'optimizing' ? 'pulse-ring' : ''}`}>
          <Activity className={`w-7 h-7 ${
            task.status === 'completed' ? 'text-emerald-400' :
            task.status === 'error' ? 'text-red-400' : 'text-medical-cyan'
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">{task.caseName}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{task.patientName} · {task.vesselType}</p>
            </div>
            <StatusBadge status={task.status} />
            {task.vesselPaused && (
              <span className="px-2.5 py-1 rounded-full bg-alert-red/20 text-alert-red text-xs font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> 血管已暂停
              </span>
            )}
            {hasWarning && (
              <span className="px-2.5 py-1 rounded-full bg-alert-orange/20 text-alert-orange text-xs font-medium flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3" /> 待复核
              </span>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-400">计算进度</span>
              <span className="text-medical-cyan font-mono font-medium">{task.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-space-dark overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  task.status === 'error' ? 'bg-gradient-to-r from-alert-red to-alert-orange' :
                  'bg-gradient-to-r from-medical-cyan to-medical-cyan-light'
                } ${task.status !== 'completed' && task.status !== 'error' && task.status !== 'pending' ? 'bg-animate-flow' : ''}`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" />
              粘度 {task.bloodParams.viscosity} cP · 流量 {task.bloodParams.flowRate} mL/s
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(task.createdAt).toLocaleString('zh-CN')}
            </span>
            {task.lowStressCount > 0 && (
              <span className="flex items-center gap-1.5 text-alert-orange">
                <AlertTriangle className="w-3.5 h-3.5" />
                低应力告警 {task.lowStressCount} 次
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {canStart && (
            <button onClick={onStart} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-medical-cyan/15 text-medical-cyan text-sm font-medium hover:bg-medical-cyan/25 transition border border-medical-cyan/20">
              <Play className="w-4 h-4" /> 启动模拟
            </button>
          )}
          <Link to={`/tasks/${task.id}`} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition">
            详情 <ChevronRight className="w-4 h-4" />
          </Link>
          {task.status === 'completed' && (
            <Link to={`/tasks/${task.id}/report`} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-medical-cyan to-medical-cyan-dark text-space-deep text-sm font-semibold">
              查看报告
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { label: string; cls: string }> = {
    pending: { label: '待校验', cls: 'bg-blue-500/20 text-blue-400 border border-blue-500/20' },
    meshing: { label: '网格生成', cls: 'bg-purple-500/20 text-purple-400 border border-purple-500/20' },
    computing: { label: '血流计算', cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' },
    optimizing: { label: '支架优化', cls: 'bg-orange-500/20 text-orange-400 border border-orange-500/20' },
    completed: { label: '已完成', cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' },
    error: { label: '异常', cls: 'bg-red-500/20 text-red-400 border border-red-500/20' },
  };
  const s = map[status];
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

function NewTaskModal({ onClose, onCreate }: { onClose: () => void; onCreate: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({
    caseName: '',
    patientName: '',
    vesselType: '冠状动脉左前降支',
    viscosity: 3.5,
    density: 1060,
    flowRate: 85,
    stressThreshold: 1.5,
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    await onCreate({
      ...form,
      bloodParams: { viscosity: form.viscosity, density: form.density, flowRate: form.flowRate },
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <div className="w-full max-w-2xl glass-card rounded-3xl p-7 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl font-bold text-white">新建模拟任务</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="病例编号/名称">
            <input
              value={form.caseName}
              onChange={e => setForm({ ...form, caseName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-space-dark border border-medical-cyan/10 text-white text-sm focus:outline-none focus:border-medical-cyan/40"
              placeholder="例: LAD-2026-007"
            />
          </Field>
          <Field label="患者姓名">
            <input
              value={form.patientName}
              onChange={e => setForm({ ...form, patientName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-space-dark border border-medical-cyan/10 text-white text-sm focus:outline-none focus:border-medical-cyan/40"
              placeholder="例: 患者G"
            />
          </Field>
          <Field label="血管类型" full>
            <select
              value={form.vesselType}
              onChange={e => setForm({ ...form, vesselType: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-space-dark border border-medical-cyan/10 text-white text-sm focus:outline-none focus:border-medical-cyan/40"
            >
              <option>冠状动脉左前降支</option>
              <option>冠状动脉右主干</option>
              <option>冠状动脉左回旋支</option>
              <option>颈动脉</option>
              <option>股动脉</option>
            </select>
          </Field>

          <div className="col-span-2 p-4 rounded-xl bg-space-dark/50 border border-medical-cyan/10">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-4 h-4 text-medical-cyan" />
              <span className="text-sm text-white font-medium">血管三维几何文件</span>
            </div>
            <div className="h-24 rounded-xl border-2 border-dashed border-medical-cyan/20 flex flex-col items-center justify-center text-gray-400 hover:border-medical-cyan/40 transition cursor-pointer">
              <Upload className="w-6 h-6 mb-1.5 text-medical-cyan/60" />
              <p className="text-xs">点击或拖拽上传 STL / OBJ 文件</p>
              <p className="text-xs text-gray-600 mt-0.5">已模拟选择: vessel_model.stl (2.4 MB)</p>
            </div>
          </div>

          <Field label="血液粘度 (cP)">
            <input type="number" step="0.1" value={form.viscosity} onChange={e => setForm({ ...form, viscosity: +e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-space-dark border border-medical-cyan/10 text-white text-sm font-mono focus:outline-none focus:border-medical-cyan/40" />
          </Field>
          <Field label="血液密度 (kg/m³)">
            <input type="number" value={form.density} onChange={e => setForm({ ...form, density: +e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-space-dark border border-medical-cyan/10 text-white text-sm font-mono focus:outline-none focus:border-medical-cyan/40" />
          </Field>
          <Field label="入口流量 (mL/s)">
            <input type="number" value={form.flowRate} onChange={e => setForm({ ...form, flowRate: +e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-space-dark border border-medical-cyan/10 text-white text-sm font-mono focus:outline-none focus:border-medical-cyan/40" />
          </Field>
          <Field label="应力阈值 (Pa)">
            <input type="number" step="0.1" value={form.stressThreshold} onChange={e => setForm({ ...form, stressThreshold: +e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-space-dark border border-medical-cyan/10 text-white text-sm font-mono focus:outline-none focus:border-medical-cyan/40" />
          </Field>
        </div>

        <div className="flex justify-end gap-3 mt-7">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition">
            取消
          </button>
          <button onClick={submit} disabled={submitting || !form.caseName || !form.patientName}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-medical-cyan to-medical-cyan-dark text-space-deep font-semibold shadow-glow-cyan hover:scale-[1.02] transition disabled:opacity-50">
            {submitting ? '提交中...' : '创建并启动模拟'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
