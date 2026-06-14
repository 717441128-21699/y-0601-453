import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Send, Activity, Download, Clock, Grid3X3, Droplets, Zap, HeartPulse, Lock, Shield, Stethoscope, ShieldAlert, User, ArrowUpRight, ArrowDownRight, Minus, RotateCcw, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import VelocityField from '../components/VelocityField';
import StressHeatmap from '../components/StressHeatmap';
import StatusFlow from '../components/StatusFlow';
import { SimulationTask, UserRole, StentAdjustment } from '../../shared/types';

const roleLabels: Record<UserRole, string> = {
  engineer: '工程师', researcher: '研究员', doctor: '医生', chief_scientist: '首席科学家',
};
const roleIcons: Record<UserRole, any> = {
  engineer: User, researcher: Shield, doctor: Stethoscope, chief_scientist: ShieldAlert,
};

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchTask, currentTask, fetchAll, reviewWarning, permissions, currentUser, tasks } = useAppStore();
  const [comment, setComment] = useState('');
  const [showResult, setShowResult] = useState<null | { ok: boolean; msg: string }>(null);
  const refreshRef = useRef<number | null>(null);
  const task = currentTask || tasks.find((t: any) => t.id === id) || null;

  useEffect(() => {
    if (id) fetchTask(id);
    refreshRef.current = window.setInterval(() => { if (id) fetchTask(id); fetchAll(); }, 4000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [id, fetchTask, fetchAll]);

  if (!task) return (
    <div className="flex items-center justify-center h-full text-gray-400">
      <Activity className="w-6 h-6 animate-spin mr-2" /> 加载中...
    </div>
  );

  const warnings = task.warnings || [];
  const pendingWarning = warnings.find((w: any) => !w.reviewResult);
  const canReview = permissions.canReviewWarnings;

  const handleReview = async (res: 'approve_adjust' | 'reject') => {
    try {
      await reviewWarning(task.id, { reviewResult: res, reviewer: currentUser.name, comment });
      setShowResult({ ok: true, msg: res === 'approve_adjust' ? '已批准支架调整，正在启动重算...' : '已驳回预警' });
      setTimeout(() => setShowResult(null), 4000);
    } catch (e: any) {
      setShowResult({ ok: false, msg: e.response?.data?.error || '操作失败' });
      setTimeout(() => setShowResult(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/tasks')} className="p-2.5 glass-card rounded-xl border border-medical-cyan/15 hover:border-medical-cyan/40 transition">
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-white glow-text">{task.caseName}</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-medical-cyan/15 text-medical-cyan border-medical-cyan/30">
              {({pending:'待校验',meshing:'网格生成',computing:'血流计算',optimizing:'支架优化',completed:'已完成',error:'异常'})[task.status]}
            </span>
            {task.surgeryPushed && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success-green/15 text-success-green border border-success-green/30">
                <CheckCircle2 className="w-3 h-3" /> 已推送手术规划
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-1">
            {task.patientName} · {task.vesselType} · ID: {task.id} · 创建于 {task.createdAt?.slice(0, 19).replace('T', ' ')}
          </p>
        </div>
        {task.status === 'completed' && (
          <Link to={`/report/${task.id}`} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-medical-cyan to-medical-cyan-dark text-space-deep rounded-xl font-semibold shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition">
            <Download className="w-5 h-5" /> 查看完整报告
          </Link>
        )}
      </div>

      {showResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${showResult.ok ? 'bg-success-green/8 border-success-green/25 text-success-green' : 'bg-alert-red/8 border-alert-red/25 text-alert-red'}`}>
          {showResult.ok ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{showResult.msg}</span>
        </div>
      )}

      {task.validationErrors && task.validationErrors.length > 0 && task.status === 'pending' && (
        <div className="glass-card rounded-2xl p-5 border border-alert-red/30 bg-alert-red/5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-alert-red/15 border border-alert-red/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-alert-red" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold">当前处于"待校验"状态，未启动模拟</h3>
              <p className="text-gray-400 text-sm mt-0.5">检测到 {task.validationErrors.length} 项不符合要求的参数，请修正后重新校验</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {task.validationErrors.map((e: any, i: number) => (
              <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-sm ${e.severity === 'error' ? 'bg-alert-red/8 border-alert-red/20 text-alert-red' : 'bg-warning-amber/8 border-warning-amber/20 text-warning-amber'}`}>
                {e.severity === 'error' ? <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <span><b className="font-semibold">[{e.field}]</b> {e.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <InfoCard icon={HeartPulse} label="血管部位" value={task.vesselType} tone="cyan" />
        <InfoCard icon={Droplets} label="血液粘度" value={`${task.bloodParams.viscosity} mPa·s`} tone="cyan" />
        <InfoCard icon={Activity} label="血流量" value={`${task.bloodParams.flowRate} mL/min`} tone="green" />
        <InfoCard icon={Shield} label="应力阈值" value={`${task.stressThreshold} Pa`} tone="amber" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <StatusFlow status={task.status as any} recomputeInProgress={task.recomputeInProgress} recomputeProgress={task.recomputeProgress} />

          {task.recomputeInProgress && (
            <div className="mt-4 glass-card rounded-2xl p-4 border border-warning-amber/30 bg-warning-amber/5">
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="w-4 h-4 text-warning-amber animate-spin" />
                <span className="text-warning-amber font-semibold text-sm">支架调整后正在重算...</span>
              </div>
              <div className="h-3 rounded-full bg-space-deep overflow-hidden border border-medical-cyan/15">
                <div className="h-full bg-gradient-to-r from-warning-amber via-medical-cyan to-success-green transition-all duration-700" style={{ width: `${task.recomputeProgress || 0}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2 font-mono text-right">{task.recomputeProgress}% · 预计剩余 {Math.max(0, Math.ceil((100 - (task.recomputeProgress || 0)) * 3.5 / 100))}s</p>
            </div>
          )}
        </div>

        <div className="col-span-9 space-y-4">
          <div className="glass-card rounded-2xl p-6 border border-medical-cyan/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-medical-cyan" /> 模拟进度</h3>
              <span className="text-2xl font-display font-bold text-medical-cyan glow-text">{task.progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-space-deep overflow-hidden border border-medical-cyan/15">
              <div className="h-full bg-gradient-to-r from-medical-cyan via-medical-cyan-dark to-success-green transition-all duration-700" style={{ width: `${task.progress}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4 text-xs">
              <Stage label="待校验" done={task.progress > 0} active={task.status === 'pending'} />
              <Stage label="网格生成" done={task.progress > 20} active={task.status === 'meshing'} />
              <Stage label="血流计算" done={task.progress > 60} active={task.status === 'computing'} />
              <Stage label="支架优化" done={task.progress >= 99} active={task.status === 'optimizing'} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-medical-cyan/10">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Droplets className="w-4 h-4 text-medical-cyan" /> 速度场云图</h3>
              <div className="rounded-xl overflow-hidden border border-medical-cyan/10 bg-space-deep/50">
                <VelocityField threshold={task.stressThreshold} />
              </div>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-medical-cyan/10">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><HeartPulse className="w-4 h-4 text-medical-cyan" /> 壁面应力热力图</h3>
              <div className="rounded-xl overflow-hidden border border-medical-cyan/10 bg-space-deep/50">
                <StressHeatmap threshold={task.stressThreshold} />
              </div>
            </div>
          </div>

          <StressCurve task={task} />

          {task.stentAdjustments && task.stentAdjustments.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-medical-cyan/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-warning-amber" /> 支架参数调整历史（{task.stentAdjustments.length} 次）</h3>
              <div className="space-y-3">
                {task.stentAdjustments.map((a: StentAdjustment) => (
                  <AdjustmentCard key={a.id} adj={a} />
                ))}
              </div>
            </div>
          )}

          {pendingWarning ? (
            <div className="glass-card rounded-2xl p-6 border-2 border-warning-amber/40 bg-warning-amber/5 animate-pulse-slow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-warning-amber/15 border border-warning-amber/30 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-warning-amber" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold flex items-center gap-2">低壁面剪切应力预警</h3>
                  <p className="text-gray-400 text-sm mt-1">{pendingWarning.message}</p>
                  <p className="text-xs text-warning-amber mt-2 font-mono">
                    检测时间：{pendingWarning.createdAt?.slice(0,19).replace('T',' ')} · 区域面积 {pendingWarning.details?.lowStressArea}% · 最低 {pendingWarning.details?.minStress?.toFixed(3)}Pa
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 p-4 rounded-xl bg-space-deep/50 border border-medical-cyan/10">
                <div className="col-span-2 text-sm text-gray-300 font-semibold flex items-center gap-2">
                  <ArrowRightIcon /> 工程师拟执行的调整方案：
                </div>
                <ParamPreview label="支架直径 (mm)" before={task.currentStent?.diameter || 3.0} after={+(task.currentStent?.diameter || 3.0) + 0.25} />
                <ParamPreview label="支架长度 (mm)" before={task.currentStent?.length || 18} after={+(task.currentStent?.length || 18) + 4} />
                <ParamPreview label="释放位置 (%)" before={task.currentStent?.position || 50} after={+(task.currentStent?.position || 50) - 3} />
                <ParamPreview label="扩张压力 (atm)" before={task.currentStent?.expansionPressure || 12} after={+(task.currentStent?.expansionPressure || 12) + 1.5} />
              </div>

              <div className="flex flex-col gap-3">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="复核意见（将记录在支架调整历史中，可留空）"
                  rows={2}
                  className="w-full px-4 py-3 bg-space-deep/70 border border-medical-cyan/15 rounded-xl text-white placeholder:text-gray-500 focus:border-medical-cyan/60 focus:outline-none text-sm"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview('reject')}
                    disabled={!canReview}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition ${canReview ? 'border border-alert-red/30 text-alert-red hover:bg-alert-red/10' : 'bg-space-deep/30 border border-gray-700 text-gray-500 cursor-not-allowed'}`}
                  >
                    {!canReview && <Lock className="w-4 h-4" />}
                    <XCircle className="w-4 h-4" />
                    {canReview ? '驳回预警（不调整）' : `需工程师角色`}
                  </button>
                  <button
                    onClick={() => handleReview('approve_adjust')}
                    disabled={!canReview}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition ${canReview ? 'bg-gradient-to-r from-warning-amber to-medical-cyan text-space-deep shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98]' : 'bg-space-deep/30 border border-gray-700 text-gray-500 cursor-not-allowed'}`}
                  >
                    {!canReview && <Lock className="w-4 h-4" />}
                    <CheckCircle2 className="w-4 h-4" />
                    {canReview ? '批准调整并重算' : `需工程师角色`}
                  </button>
                </div>
              </div>
            </div>
          ) : task.stentAdjustments && task.stentAdjustments.length > 0 ? (
            <div className="glass-card rounded-2xl p-4 border border-success-green/25 bg-success-green/5">
              <p className="text-sm text-success-green flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> 所有预警均已处理，最近一次调整于 {task.stentAdjustments[task.stentAdjustments.length - 1].timestamp.slice(0, 19).replace('T', ' ')} 由 {task.stentAdjustments[task.stentAdjustments.length - 1].operator} 执行。</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, tone }: any) {
  const tones: Record<string, string> = {
    cyan: 'bg-medical-cyan/10 border-medical-cyan/25 text-medical-cyan',
    green: 'bg-success-green/10 border-success-green/25 text-success-green',
    amber: 'bg-warning-amber/10 border-warning-amber/25 text-warning-amber',
  };
  return (
    <div className="glass-card rounded-2xl p-4 border border-medical-cyan/10">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${tones[tone]}`}><Icon className="w-5 h-5" /></div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-white font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Stage({ label, done, active }: any) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${done ? 'bg-success-green/5 border-success-green/20 text-success-green' : active ? 'bg-medical-cyan/10 border-medical-cyan/30 text-medical-cyan animate-pulse' : 'bg-space-deep/50 border-gray-700/40 text-gray-500'}`}>
      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function StressCurve({ task }: any) {
  const points = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= 50; i++) {
      const x = i * 2;
      const base = 2.2 + Math.sin(x * 0.28) * 0.6 - Math.max(0, Math.sin((x - 60) * 0.1)) * 1.1;
      arr.push([x, Math.max(0.15, base + (task.stressResult?.maxStressPa ? 0 : 0))]);
    }
    return arr;
  }, [task.id]);
  const threshold = task.stressThreshold;
  return (
    <div className="glass-card rounded-2xl p-5 border border-medical-cyan/10">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-medical-cyan" /> 轴向壁面应力曲线</h3>
      <svg viewBox="0 0 400 160" className="w-full h-40">
        <defs>
          <linearGradient id="grad1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="40" x2="390" y1={130 - (threshold / 5) * 120} y2={130 - (threshold / 5) * 120} stroke="#F59E0B" strokeDasharray="6 4" strokeWidth="1.2" />
        <text x="395" y={130 - (threshold / 5) * 120 + 4} fontSize="9" fill="#F59E0B">阈值 {threshold}Pa</text>
        {[0.5, 1, 2, 3, 4].map((y) => (
          <g key={y}>
            <line x1="40" x2="390" y1={130 - (y / 5) * 120} y2={130 - (y / 5) * 120} stroke="rgba(0,212,170,0.08)" />
            <text x="5" y={130 - (y / 5) * 120 + 3} fontSize="8" fill="#64748B">{y}Pa</text>
          </g>
        ))}
        <polygon points={`40,130 ${points.map((p: any) => `${40 + p[0] * 3.5},${130 - (p[1] / 5) * 120}`).join(' ')} 390,130`} fill="url(#grad1)" />
        <polyline fill="none" stroke="#00D4AA" strokeWidth="2"
          points={points.map((p: any) => `${40 + p[0] * 3.5},${130 - (p[1] / 5) * 120}`).join(' ')} />
        {points.filter((p: any) => p[1] < threshold).map((p: any, i: number) => (
          <circle key={i} cx={40 + p[0] * 3.5} cy={130 - (p[1] / 5) * 120} r="2.5" fill="#EF4444" opacity="0.9" />
        ))}
      </svg>
    </div>
  );
}

function ParamPreview({ label, before, after }: any) {
  const delta = after - before;
  const DirIco = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  const dirCls = delta > 0 ? 'text-success-green' : delta < 0 ? 'text-medical-cyan' : 'text-gray-500';
  return (
    <div className="p-3 rounded-lg bg-space-deep/40 border border-medical-cyan/8">
      <p className="text-[10px] text-gray-500 uppercase mb-1.5">{label}</p>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-gray-400 font-mono line-through">{before}</span>
        <ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
        <span className="text-sm text-white font-mono font-semibold">{after}</span>
        <span className={`flex items-center text-xs font-mono ${dirCls}`}>
          <DirIco className="w-3 h-3" />
          {delta > 0 ? '+' : ''}{delta.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function AdjustmentCard({ adj }: { adj: StentAdjustment }) {
  const keys: Array<{ k: keyof typeof adj.before; label: string; unit?: string }> = [
    { k: 'diameter', label: '直径', unit: 'mm' }, { k: 'length', label: '长度', unit: 'mm' },
    { k: 'position', label: '位置', unit: '%' }, { k: 'expansionPressure', label: '扩张压', unit: 'atm' },
  ];
  return (
    <div className="p-4 rounded-xl bg-space-deep/40 border border-medical-cyan/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-warning-amber/15 border border-warning-amber/25 flex items-center justify-center">
            <Zap className="w-4 h-4 text-warning-amber" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              #{adj.id.toUpperCase().slice(-4)}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-amber/15 text-warning-amber">
                {adj.reason}
              </span>
            </p>
            <p className="text-[10px] text-gray-500 font-mono">{adj.timestamp.slice(0, 19).replace('T', ' ')} · 操作人：{adj.operator}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {keys.map(({ k, label, unit }) => {
          const b = (adj.before as any)[k]; const a = (adj.after as any)[k];
          const d = a - b; const DirIco = d > 0 ? ArrowUpRight : d < 0 ? ArrowDownRight : Minus;
          const dirCls = d > 0 ? 'text-success-green' : d < 0 ? 'text-medical-cyan' : 'text-gray-500';
          return (
            <div key={k} className="px-2.5 py-2 rounded-lg bg-space-deep/60 border border-medical-cyan/5">
              <p className="text-[10px] text-gray-500 mb-1">{label} ({unit})</p>
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs text-gray-400 font-mono line-through">{b}</span>
                <span className="text-xs text-white font-mono font-semibold">{a}</span>
                <span className={`flex items-center text-[10px] font-mono ${dirCls}`}>
                  <DirIco className="w-2.5 h-2.5" />
                  {d > 0 ? '+' : ''}{d.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ArrowRightIcon() {
  return <span className="w-5 h-5 rounded-lg bg-medical-cyan/15 border border-medical-cyan/25 flex items-center justify-center"><ArrowRight className="w-3 h-3 text-medical-cyan" /></span>;
}
