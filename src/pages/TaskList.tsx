import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ChevronDown, File, AlertTriangle, CheckCircle2, XCircle, Clock, Grid3X3, Droplets, Zap, Sparkles, X, Upload, RotateCcw, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SimulationTask, TaskStatus, GeometryFileInfo, ValidationFailure } from '../../shared/types';

const statusLabels: Record<TaskStatus, string> = {
  pending: '待校验',
  meshing: '网格生成',
  computing: '血流计算',
  optimizing: '支架优化',
  completed: '已完成',
  error: '异常',
};

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-warning-amber/15 text-warning-amber border-warning-amber/30',
  meshing: 'bg-space-blue/30 text-medical-cyan border-medical-cyan/30',
  computing: 'bg-space-blue/30 text-medical-cyan border-medical-cyan/30',
  optimizing: 'bg-warning-amber/15 text-warning-amber border-warning-amber/30',
  completed: 'bg-success-green/15 text-success-green border-success-green/30',
  error: 'bg-alert-red/15 text-alert-red border-alert-red/30',
};

const vesselOptions = ['LAD 前降支', 'RCA 右冠动脉', 'LCX 回旋支', '肺动脉', '颈动脉'];

export default function TaskList() {
  const navigate = useNavigate();
  const { tasks, fetchAll, createTask, retryValidation, loading, pausedVessels } = useAppStore();
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !t.caseName.includes(search) && !t.patientName.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white glow-text">任务管理</h1>
          <p className="text-gray-400 text-sm mt-1">共 {tasks.length} 个任务 · {loading ? '加载中...' : '已就绪'}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-medical-cyan to-medical-cyan-dark text-space-deep rounded-xl font-semibold shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition"
        >
          <Plus className="w-5 h-5" />
          新建模拟任务
        </button>
      </div>

      <div className="glass-card rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索病例名称或患者..."
            className="w-full pl-10 pr-4 py-2.5 bg-space-deep/50 border border-medical-cyan/15 rounded-xl text-white placeholder:text-gray-500 focus:border-medical-cyan/50 focus:outline-none"
          />
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="appearance-none pl-4 pr-10 py-2.5 bg-space-deep/50 border border-medical-cyan/15 rounded-xl text-white focus:border-medical-cyan/50 focus:outline-none cursor-pointer"
          >
            <option value="all">全部状态</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-medical-cyan/20 rounded-xl text-gray-300 hover:text-white hover:border-medical-cyan/40 transition">
          <Filter className="w-4 h-4" /> 高级筛选
        </button>
      </div>

      <div className="grid gap-4">
        {filtered.map(task => (
          <TaskCard key={task.id} task={task} onClick={() => navigate(`/task/${task.id}`)} onRetry={() => retryValidation(task.id)} />
        ))}
        {filtered.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Sparkles className="w-12 h-12 text-medical-cyan/40 mx-auto mb-4" />
            <p className="text-gray-400">暂无匹配的任务</p>
          </div>
        )}
      </div>

      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onCreated={(t) => { setShowModal(false); navigate(`/task/${t.id}`); }}
          createTask={createTask}
          pausedVessels={pausedVessels}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onClick, onRetry }: { task: SimulationTask; onClick: () => void; onRetry: () => void }) {
  const hasValidationErrors = task.validationErrors && task.validationErrors.length > 0;
  return (
    <div
      onClick={onClick}
      className="glass-card rounded-2xl p-5 border border-medical-cyan/10 hover:border-medical-cyan/30 hover:shadow-glow-cyan transition cursor-pointer group"
    >
      <div className="flex items-start gap-5">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${statusColors[task.status]}`}>
          {task.status === 'pending' && <Clock className="w-7 h-7" />}
          {task.status === 'meshing' && <Grid3X3 className="w-7 h-7 animate-spin-slow" />}
          {task.status === 'computing' && <Droplets className="w-7 h-7 animate-pulse" />}
          {task.status === 'optimizing' && <Zap className="w-7 h-7 animate-pulse" />}
          {task.status === 'completed' && <CheckCircle2 className="w-7 h-7" />}
          {task.status === 'error' && <XCircle className="w-7 h-7" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-display font-bold text-white text-lg group-hover:text-medical-cyan transition">{task.caseName}</h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[task.status]}`}>
              {statusLabels[task.status]}
            </span>
            {task.geometryFile && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-space-deep/50 text-gray-400 text-xs border border-medical-cyan/10">
                <File className="w-3 h-3" />
                {task.geometryFile.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400 mb-3">
            <span>患者：{task.patientName}</span>
            <span>血管：{task.vesselType}</span>
            <span className="font-mono">ID: {task.id}</span>
          </div>

          {hasValidationErrors && (
            <div onClick={(e) => e.stopPropagation()} className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-alert-red text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  校验失败 · 共 {task.validationErrors!.length} 项问题
                </p>
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-medical-cyan/10 text-medical-cyan hover:bg-medical-cyan/20 border border-medical-cyan/20"
                >
                  <RotateCcw className="w-3 h-3" /> 重新校验
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {task.validationErrors!.slice(0, 4).map((err, i) => (
                  <div key={i} className="flex items-start gap-1.5 px-2 py-1 rounded-md bg-alert-red/5 text-alert-red/90 text-xs border border-alert-red/15">
                    <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span><b className="font-semibold">[{err.field}]</b> {err.message}</span>
                  </div>
                ))}
                {task.validationErrors!.length > 4 && (
                  <p className="text-xs text-alert-red/70 px-2">...还有 {task.validationErrors!.length - 4} 项</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-medical-cyan/5 flex items-center justify-between">
            <div className="h-2 w-48 rounded-full bg-space-deep overflow-hidden border border-medical-cyan/10">
              <div
                className="h-full bg-gradient-to-r from-medical-cyan to-medical-cyan-dark transition-all duration-700"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {task.status === 'completed' ? task.completedAt?.slice(0, 16).replace('T', ' ') : '进度 ' + task.progress + '%'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CreateModalProps {
  onClose: () => void;
  onCreated: (t: SimulationTask) => void;
  createTask: (data: any) => Promise<SimulationTask>;
  pausedVessels: any[];
}

function CreateTaskModal({ onClose, onCreated, createTask, pausedVessels }: CreateModalProps) {
  const [form, setForm] = useState({
    caseName: '',
    patientName: '',
    vesselType: vesselOptions[0],
    viscosity: 4.5,
    density: 1060,
    flowRate: 280,
    stressThreshold: 1.2,
  });
  const [geometryFile, setGeometryFile] = useState<GeometryFileInfo | null>(null);
  const [localErrors, setLocalErrors] = useState<ValidationFailure[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SimulationTask | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const vesselPauseHint = pausedVessels.find(p => p.status === 'pending' && p.vesselType === form.vesselType);

  const validateLocal = (f: typeof form, gf: GeometryFileInfo | null): ValidationFailure[] => {
    const errs: ValidationFailure[] = [];
    if (!f.caseName || f.caseName.trim().length < 3) errs.push({ field: '病例名称', message: '至少3个字符', severity: 'error' });
    if (!f.patientName || f.patientName.trim().length < 2) errs.push({ field: '患者', message: '至少2个字符', severity: 'error' });
    if (f.viscosity < 1 || f.viscosity > 20) errs.push({ field: '血液粘度', message: `范围1~20 mPa·s，当前${f.viscosity}`, severity: 'error' });
    if (f.density < 800 || f.density > 1200) errs.push({ field: '血液密度', message: `范围800~1200 kg/m³，当前${f.density}`, severity: 'error' });
    if (f.flowRate < 50 || f.flowRate > 800) errs.push({ field: '血流量', message: `范围50~800 mL/min，当前${f.flowRate}`, severity: 'error' });
    if (f.stressThreshold < 0.1 || f.stressThreshold > 10) errs.push({ field: '应力阈值', message: `范围0.1~10 Pa，当前${f.stressThreshold}`, severity: 'error' });
    if (!gf) errs.push({ field: '几何文件', message: '必须上传 STL/OBJ 血管三维几何文件', severity: 'error' });
    else {
      const ext = gf.format.toLowerCase();
      if (!['stl', 'obj', 'step', 'iges'].includes(ext)) errs.push({ field: '几何文件', message: `不支持的格式 .${ext}，仅支持 STL/OBJ/STEP/IGES`, severity: 'error' });
      if (gf.sizeBytes > 200 * 1024 * 1024) errs.push({ field: '几何文件', message: `超过200MB上限，当前${(gf.sizeBytes/1024/1024).toFixed(1)}MB`, severity: 'error' });
      if (gf.sizeBytes < 1024) errs.push({ field: '几何文件', message: '文件过小疑似空文件', severity: 'warning' });
    }
    return errs;
  };

  useEffect(() => {
    setLocalErrors(validateLocal(form, geometryFile));
  }, [form, geometryFile]);

  const handleFile = (f: File) => {
    const name = f.name;
    const ext = name.split('.').pop()?.toLowerCase() || '';
    setGeometryFile({
      name,
      format: (['stl','obj','step','iges','igs'].includes(ext) ? ext : 'unknown') as GeometryFileInfo['format'],
      sizeBytes: f.size,
      uploadedAt: new Date().toISOString(),
      checksum: 'mock_' + (f.size % 9999),
      vertexCount: Math.floor(f.size / 200),
      faceCount: Math.floor(f.size / 300),
    });
  };

  const handleSubmit = async () => {
    if (localErrors.some(e => e.severity === 'error')) return;
    setSubmitting(true);
    try {
      const task = await createTask({
        caseName: form.caseName.trim(),
        patientName: form.patientName.trim(),
        vesselType: form.vesselType,
        bloodParams: { viscosity: form.viscosity, density: form.density, flowRate: form.flowRate },
        stressThreshold: form.stressThreshold,
        geometryFile: geometryFile || undefined,
      });
      setResult(task);
    } finally { setSubmitting(false); }
  };

  const fileSize = (b: number) => b < 1024 ? b + ' B' : b < 1024*1024 ? (b/1024).toFixed(1)+' KB' : (b/1024/1024).toFixed(2)+' MB';

  if (result) {
    const resultErrors = result.validationErrors || [];
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="glass-card rounded-3xl w-full max-w-xl border border-medical-cyan/20 shadow-card overflow-hidden">
          <div className={`p-6 border-b ${resultErrors.length > 0 ? 'border-alert-red/20 bg-alert-red/5' : 'border-success-green/20 bg-success-green/5'}`}>
            <div className="flex items-center gap-3">
              {resultErrors.length > 0 ? (
                <div className="w-12 h-12 rounded-xl bg-alert-red/15 border border-alert-red/30 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-alert-red" /></div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-success-green/15 border border-success-green/30 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-success-green" /></div>
              )}
              <div>
                <h2 className="text-xl font-display font-bold text-white">{resultErrors.length > 0 ? '任务已保存至"待校验"' : '任务启动成功'}</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {resultErrors.length > 0 ? `检测到 ${resultErrors.length} 项问题未启动模拟` : '任务已进入六态自动流转'}
                </p>
              </div>
              <button onClick={onClose} className="ml-auto p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-auto">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="任务ID" value={result.id} mono />
              <Info label="当前状态" value={statusLabels[result.status]} />
              <Info label="病例" value={result.caseName} />
              <Info label="患者" value={result.patientName} />
            </div>

            {resultErrors.length > 0 && (
              <div className="space-y-2">
                <p className="text-alert-red text-sm font-semibold flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> 具体问题（修正后可重新校验）：</p>
                {resultErrors.map((err, i) => (
                  <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${err.severity === 'error' ? 'bg-alert-red/8 border-alert-red/20 text-alert-red' : 'bg-warning-amber/8 border-warning-amber/20 text-warning-amber'}`}>
                    {err.severity === 'error' ? <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    <div className="text-sm"><b className="font-semibold">[{err.field}]</b> {err.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-medical-cyan/10 flex items-center gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-medical-cyan/20 rounded-xl text-gray-300 hover:bg-white/5 transition">
              返回列表
            </button>
            <button onClick={() => onCreated(result)} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-medical-cyan to-medical-cyan-dark text-space-deep rounded-xl font-semibold shadow-glow-cyan hover:scale-[1.02] transition">
              {resultErrors.length > 0 ? '查看详情 / 修正' : '进入任务监控'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl w-full max-w-3xl border border-medical-cyan/20 shadow-card overflow-hidden">
        <div className="p-6 border-b border-medical-cyan/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-white">新建血流动力学模拟任务</h2>
            <p className="text-gray-400 text-sm mt-1">请完整填写以下信息，系统将自动校验后启动模拟</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-auto">
          {vesselPauseHint && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-alert-red/8 border border-alert-red/30 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-alert-red mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-alert-red font-semibold text-sm">⚠ 该血管已被暂停受理</p>
                <p className="text-alert-red/80 text-xs mt-1">
                  血管「{vesselPauseHint.vesselType}」因连续 {vesselPauseHint.offenseCount} 次低应力区超标于 {vesselPauseHint.suspendedAt?.slice(0,16).replace('T',' ')} 被暂停。
                  创建后任务将停在"待校验"，需经<u>首席科学家</u>解除暂停后方可启动模拟。
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="病例名称" hint="3~50字，如【2025-Q3-LAD-018】">
              <input value={form.caseName} onChange={e => setForm({ ...form, caseName: e.target.value })} className={inputCls} placeholder="请输入病例编号" />
            </Field>
            <Field label="患者姓名" hint="2~20字">
              <input value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} className={inputCls} placeholder="如：张建国" />
            </Field>
            <Field label="血管部位" hint="选择目标血管">
              <select value={form.vesselType} onChange={e => setForm({ ...form, vesselType: e.target.value })} className={inputCls}>
                {vesselOptions.map(v => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="应力阈值 (Pa)" hint="低应力告警线，通常0.5~3">
              <input type="number" step="0.1" value={form.stressThreshold} onChange={e => setForm({ ...form, stressThreshold: +e.target.value })} className={inputCls} />
            </Field>
          </div>

          <div className="glass-card rounded-xl p-4 border border-medical-cyan/10 space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2"><Droplets className="w-4 h-4 text-medical-cyan" /> 血液动力学参数</h3>
            <div className="grid grid-cols-3 gap-4">
              <NumField label="粘度 (mPa·s)" value={form.viscosity} min={1} max={20} step={0.1} onChange={v => setForm({ ...form, viscosity: v })} />
              <NumField label="密度 (kg/m³)" value={form.density} min={800} max={1200} step={1} onChange={v => setForm({ ...form, density: v })} />
              <NumField label="流量 (mL/min)" value={form.flowRate} min={50} max={800} step={5} onChange={v => setForm({ ...form, flowRate: v })} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2"><File className="w-4 h-4 text-medical-cyan" /> 血管三维几何文件</h3>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); }}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              className="border-2 border-dashed border-medical-cyan/30 rounded-xl p-8 text-center hover:border-medical-cyan/60 hover:bg-medical-cyan/5 transition cursor-pointer"
            >
              <input ref={fileRef} type="file" accept=".stl,.obj,.step,.iges,.igs" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <Upload className="w-10 h-10 text-medical-cyan/60 mx-auto mb-3" />
              <p className="text-white font-medium">点击选择或拖拽文件到此区域</p>
              <p className="text-xs text-gray-500 mt-1">支持 .stl / .obj / .step / .iges · 单文件 ≤ 200MB</p>
            </div>

            {geometryFile && (
              <div className="glass-card rounded-xl p-4 border border-medical-cyan/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-medical-cyan/15 border border-medical-cyan/30 flex items-center justify-center">
                    <File className="w-5 h-5 text-medical-cyan" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{geometryFile.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{geometryFile.format.toUpperCase()} · {fileSize(geometryFile.sizeBytes)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckTag ok={['stl','obj','step','iges','igs'].includes(geometryFile.format.toLowerCase())} label="格式" />
                    <CheckTag ok={geometryFile.sizeBytes <= 200*1024*1024 && geometryFile.sizeBytes >= 1024} label="大小" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {localErrors.length > 0 && (
            <div className="space-y-2">
              <p className="text-alert-red text-sm font-semibold flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> 提交前校验提示（{localErrors.filter(e=>e.severity==='error').length} 错误 / {localErrors.filter(e=>e.severity==='warning').length} 警告）</p>
              {localErrors.map((err, i) => (
                <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-sm ${err.severity === 'error' ? 'bg-alert-red/8 border-alert-red/20 text-alert-red' : 'bg-warning-amber/8 border-warning-amber/20 text-warning-amber'}`}>
                  {err.severity === 'error' ? <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <span><b className="font-semibold">[{err.field}]</b> {err.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-medical-cyan/10 flex items-center gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 border border-medical-cyan/20 rounded-xl text-gray-300 hover:bg-white/5 transition">
            取消
          </button>
          <button
            disabled={submitting || localErrors.some(e=>e.severity==='error')}
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-medical-cyan to-medical-cyan-dark text-space-deep rounded-xl font-semibold shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {submitting ? '提交中...' : '创建任务并自动校验'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 bg-space-deep/70 border border-medical-cyan/15 rounded-xl text-white placeholder:text-gray-500 focus:border-medical-cyan/60 focus:outline-none transition";

function Field({ label, hint, children }: any) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        {hint && <span className="text-[10px] text-gray-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function NumField({ label, value, min, max, step, onChange }: any) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label} <span className="text-gray-600">[{min}~{max}]</span></label>
      <input type="number" step={step} min={min} max={max} value={value} onChange={e => onChange(+e.target.value)} className={inputCls} />
    </div>
  );
}

function CheckTag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${ok ? 'bg-success-green/10 text-success-green border-success-green/25' : 'bg-alert-red/10 text-alert-red border-alert-red/25'}`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}{ok ? '通过' : '未通过'}
    </span>
  );
}

function Info({ label, value, mono }: any) {
  return (
    <div className="px-3 py-2 rounded-lg bg-space-deep/50 border border-medical-cyan/10">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm text-white ${mono ? 'font-mono' : ''}`}>{value || '-'}</p>
    </div>
  );
}
