import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, FileCheck, Send, User, Shield, Stethoscope, ShieldAlert, ChevronRight, AlertTriangle, Lock, Eye } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SimulationTask, ApprovalRecord, UserRole } from '../../shared/types';

const roleLabels: Record<UserRole, string> = {
  engineer: '工程师',
  researcher: '研究员',
  doctor: '医生',
  chief_scientist: '首席科学家',
};

const roleIcons: Record<UserRole, any> = {
  engineer: User,
  researcher: Shield,
  doctor: Stethoscope,
  chief_scientist: ShieldAlert,
};

export default function ApprovalCenter() {
  const navigate = useNavigate();
  const { tasks, fetchAll, submitApproval, pushToSurgery, permissions, currentUser } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const approvalTasks = tasks.filter(t => ['optimizing', 'completed', 'computing', 'meshing'].includes(t.status) || t.approvals?.length > 0);

  const filtered = approvalTasks.filter(t => {
    const lv1 = t.approvals?.find(a => a.level === 1);
    const lv2 = t.approvals?.find(a => a.level === 2);
    if (filter === 'pending') return !lv2 || lv2.result === 'rejected' || (!lv1 || lv1.result === 'rejected');
    if (filter === 'approved') return lv2?.result === 'approved';
    if (filter === 'rejected') return lv1?.result === 'rejected' || lv2?.result === 'rejected';
    return true;
  });

  const awaitingL1 = approvalTasks.filter(t => !t.approvals?.find(a => a.level === 1)).length;
  const awaitingL2 = approvalTasks.filter(t => {
    const lv1 = t.approvals?.find(a => a.level === 1);
    const lv2 = t.approvals?.find(a => a.level === 2);
    return lv1?.result === 'approved' && lv2?.result !== 'approved';
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white glow-text">审批中心</h1>
        <p className="text-gray-400 text-sm mt-1">当前角色：<span className="text-medical-cyan font-semibold">{roleLabels[currentUser.role]} · {currentUser.name}</span></p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={FileCheck} label="待一级审批" value={permissions.canApproveLevel1 ? awaitingL1 : 0} tone="cyan" subtitle={permissions.canApproveLevel1 ? '研究员可操作' : '需研究员角色'} />
        <StatCard icon={Shield} label="待二级审批" value={permissions.canApproveLevel2 ? awaitingL2 : 0} tone="amber" subtitle={permissions.canApproveLevel2 ? '医生可操作' : '需医生角色'} />
        <StatCard icon={CheckCircle} label="已通过" value={tasks.filter(t => t.approvals?.some(a => a.level === 2 && a.result === 'approved')).length} tone="green" />
        <StatCard icon={Send} label="已推送手术规划" value={tasks.filter(t => t.surgeryPushed).length} tone="cyan" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { k: 'all', l: '全部' }, { k: 'pending', l: '待处理' }, { k: 'approved', l: '已通过' }, { k: 'rejected', l: '已驳回' },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setFilter(t.k as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === t.k ? 'bg-medical-cyan/15 text-medical-cyan border border-medical-cyan/30' : 'glass-card border border-medical-cyan/10 text-gray-400 hover:text-white'}`}
          >
            {t.l}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.map(t => (
          <ApprovalCard
            key={t.id}
            task={t}
            onSubmit={(lvl, res, cmt) => submitApproval(t.id, { level: lvl, result: res, comment: cmt, reviewer: currentUser.name })}
            onPush={() => pushToSurgery(t.id)}
            onClick={() => navigate(`/task/${t.id}`)}
            canL1={permissions.canApproveLevel1}
            canL2={permissions.canApproveLevel2}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone, subtitle }: any) {
  const tones: Record<string, string> = {
    cyan: 'text-medical-cyan border-medical-cyan/30 bg-medical-cyan/10',
    amber: 'text-warning-amber border-warning-amber/30 bg-warning-amber/10',
    green: 'text-success-green border-success-green/30 bg-success-green/10',
  };
  return (
    <div className="glass-card rounded-2xl p-5 border border-medical-cyan/10">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-display font-bold text-white glow-text mb-1">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
      {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
}

function ApprovalCard({ task, onSubmit, onPush, onClick, canL1, canL2 }: any) {
  const [comment, setComment] = useState('');
  const lv1 = task.approvals?.find((a: ApprovalRecord) => a.level === 1);
  const lv2 = task.approvals?.find((a: ApprovalRecord) => a.level === 2);

  const L1State = lv1 ? (lv1.result === 'approved' ? 'pass' : 'reject') : (task.progress >= 80 ? 'active' : 'locked');
  const L2State = lv2 ? (lv2.result === 'approved' ? 'pass' : 'reject') : (L1State === 'pass' ? 'active' : 'locked');

  return (
    <div className="glass-card rounded-2xl p-6 border border-medical-cyan/10 hover:border-medical-cyan/30 transition">
      <div className="flex items-start gap-6">
        <div onClick={onClick} className="cursor-pointer flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-display font-bold text-white text-lg hover:text-medical-cyan transition">{task.caseName}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              task.status === 'completed' ? 'bg-success-green/15 text-success-green border-success-green/30'
              : task.status === 'error' ? 'bg-alert-red/15 text-alert-red border-alert-red/30'
              : 'bg-medical-cyan/15 text-medical-cyan border-medical-cyan/30'
            }`}>
              {({pending:'待校验',meshing:'网格生成',computing:'血流计算',optimizing:'支架优化',completed:'已完成',error:'异常'})[task.status]}
            </span>
            <Eye className="w-4 h-4 text-gray-500 ml-auto" />
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>患者：{task.patientName}</span>
            <span>血管：{task.vesselType}</span>
            <span className="font-mono">ID: {task.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <ApprovalStep
            num={1}
            title="一级审批"
            subtitle="生物力学研究员"
            state={L1State as any}
            record={lv1}
            locked={!canL1 && L1State === 'active'}
          />
          <ChevronRight className="w-5 h-5 text-medical-cyan/30" />
          <ApprovalStep
            num={2}
            title="二级审批"
            subtitle="主治医师"
            state={L2State as any}
            record={lv2}
            locked={!canL2 && L2State === 'active'}
          />
          <ChevronRight className="w-5 h-5 text-medical-cyan/30" />
          <div className={`flex flex-col items-center p-3 rounded-xl min-w-[110px] border ${task.surgeryPushed ? 'bg-success-green/10 border-success-green/25' : 'bg-space-deep/40 border-medical-cyan/10'}`}>
            <Send className={`w-5 h-5 mb-1 ${task.surgeryPushed ? 'text-success-green' : 'text-gray-600'}`} />
            <p className={`text-xs font-semibold ${task.surgeryPushed ? 'text-success-green' : 'text-gray-500'}`}>{task.surgeryPushed ? '已推送' : '手术规划'}</p>
          </div>
        </div>
      </div>

      {task.approvals?.length > 0 && (
        <div className="mt-5 pt-4 border-t border-medical-cyan/5 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">审批记录</p>
          {task.approvals.map((a: ApprovalRecord, i: number) => {
            const RoleIco = roleIcons[a.reviewerRole || 'engineer'];
            return (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-space-deep/30 border border-medical-cyan/8">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${a.result === 'approved' ? 'bg-success-green/10 border-success-green/20' : 'bg-alert-red/10 border-alert-red/20'}`}>
                  <RoleIco className={`w-4 h-4 ${a.result === 'approved' ? 'text-success-green' : 'text-alert-red'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white font-medium">第 {a.level} 级</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${a.result === 'approved' ? 'bg-success-green/15 text-success-green' : 'bg-alert-red/15 text-alert-red'}`}>
                      {a.result === 'approved' ? '通过' : '驳回'}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-medical-cyan font-semibold">{a.reviewer}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-medical-cyan/10 text-medical-cyan/80">
                      {roleLabels[a.reviewerRole || 'engineer']}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{a.comment || '（无意见）'} · {(a.timestamp || a.createdAt)?.slice(0, 16).replace('T', ' ')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-medical-cyan/5 flex items-center gap-4 flex-wrap">
        <input
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="审批意见..."
          className="flex-1 min-w-[240px] px-4 py-2.5 bg-space-deep/70 border border-medical-cyan/15 rounded-xl text-white placeholder:text-gray-500 focus:border-medical-cyan/60 focus:outline-none text-sm"
        />

        {L1State === 'active' && (
          <ActionBtns can={canL1} needRole="生物力学研究员" onApprove={() => onSubmit(1, 'approved', comment)} onReject={() => onSubmit(1, 'rejected', comment)} />
        )}

        {L2State === 'active' && (
          <ActionBtns can={canL2} needRole="主治医师" onApprove={() => onSubmit(2, 'approved', comment)} onReject={() => onSubmit(2, 'rejected', comment)} />
        )}

        {L2State === 'pass' && (
          <button
            onClick={() => onPush()}
            disabled={!canL2}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition ${
              canL2
                ? 'bg-gradient-to-r from-medical-cyan to-medical-cyan-dark text-space-deep shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-space-deep/50 text-gray-500 border border-gray-700 cursor-not-allowed'
            }`}
          >
            {!canL2 && <Lock className="w-4 h-4" />}
            <Send className="w-4 h-4" />
            {canL2 ? (task.surgeryPushed ? '重新推送' : '推送至手术规划') : '需医生角色'}
          </button>
        )}
      </div>
    </div>
  );
}

function ApprovalStep({ num, title, subtitle, state, record, locked }: any) {
  const cfgMap: Record<string, any> = {
    pass: { ring: 'ring-2 ring-success-green', ico: CheckCircle, ic: 'text-success-green', bd: 'border-success-green/30 bg-success-green/5', tx: 'text-success-green' },
    reject: { ring: 'ring-2 ring-alert-red', ico: XCircle, ic: 'text-alert-red', bd: 'border-alert-red/30 bg-alert-red/5', tx: 'text-alert-red' },
    active: { ring: 'ring-2 ring-medical-cyan animate-pulse', ico: Clock, ic: 'text-medical-cyan', bd: 'border-medical-cyan/30 bg-medical-cyan/5', tx: 'text-medical-cyan' },
    locked: { ring: '', ico: Lock, ic: 'text-gray-600', bd: 'border-gray-700/40 bg-space-deep/30', tx: 'text-gray-500' },
  };
  const cfg = cfgMap[state] || cfgMap.locked;
  const Ico = cfg.ico;

  return (
    <div className={`flex flex-col items-center p-3 rounded-xl min-w-[130px] border ${cfg.bd} ${cfg.ring}`}>
      <div className={`relative w-9 h-9 rounded-full flex items-center justify-center bg-space-deep ${cfg.ic}`}>
        <Ico className="w-5 h-5" />
        <span className={`absolute -top-1 -left-1 w-5 h-5 rounded-full border-2 border-space-deep bg-space-blue flex items-center justify-center text-[10px] font-bold ${cfg.tx}`}>{num}</span>
      </div>
      <p className={`text-xs font-semibold mt-2 ${cfg.tx}`}>{title}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>
      {state === 'active' && locked && <span className="flex items-center gap-1 mt-1 text-[10px] text-gray-500"><AlertTriangle className="w-3 h-3" />无权限</span>}
      {record && <span className="text-[10px] text-gray-500 mt-1 truncate max-w-[120px]">{record.reviewer}</span>}
    </div>
  );
}

function ActionBtns({ can, needRole, onApprove, onReject }: any) {
  return (
    <>
      <button
        onClick={onReject}
        disabled={!can}
        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition ${can ? 'border border-alert-red/30 text-alert-red hover:bg-alert-red/10' : 'border border-gray-700 text-gray-500 cursor-not-allowed'}`}
      >
        {!can && <Lock className="w-3.5 h-3.5" />}
        <XCircle className="w-4 h-4" />
        {can ? '驳回' : `需${needRole}`}
      </button>
      <button
        onClick={onApprove}
        disabled={!can}
        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${can ? 'bg-success-green/15 text-success-green border border-success-green/30 hover:bg-success-green/25' : 'bg-space-deep/50 text-gray-500 border border-gray-700 cursor-not-allowed'}`}
      >
        {!can && <Lock className="w-3.5 h-3.5" />}
        <CheckCircle className="w-4 h-4" />
        {can ? '通过' : `需${needRole}`}
      </button>
    </>
  );
}
