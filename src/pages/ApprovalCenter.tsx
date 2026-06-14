import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle2, XCircle, FileText, Clock, Shield, User, Send, AlertTriangle } from 'lucide-react';
import { SimulationTask } from '../../shared/types';

export default function ApprovalCenter() {
  const { tasks, fetchAll, submitApproval, pushToSurgery, currentUser } = useAppStore();
  const [filter, setFilter] = useState<'pending' | 'done'>('pending');
  const [openId, setOpenId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pending = tasks.filter(t =>
    t.status === 'completed' && t.approvalStatus &&
    t.approvalStatus !== 'level2_approved' && t.approvalStatus !== 'pushed_to_surgery' && t.approvalStatus !== 'rejected'
  );
  const done = tasks.filter(t =>
    t.status === 'completed' &&
    (t.approvalStatus === 'level2_approved' || t.approvalStatus === 'pushed_to_surgery' || t.approvalStatus === 'rejected')
  );
  const list = filter === 'pending' ? pending : done;

  const myLevel: 1 | 2 = currentUser.role === 'researcher' ? 1 : currentUser.role === 'doctor' ? 2 : 1;

  const approve = (taskId: string, level: 1 | 2) => {
    submitApproval(taskId, {
      level, result: 'approved', comment: comment || '审批通过，方案合理', reviewer: currentUser.name,
    });
    setOpenId(null);
    setComment('');
  };
  const reject = (taskId: string, level: 1 | 2) => {
    submitApproval(taskId, {
      level, result: 'rejected', comment: comment || '需要进一步优化', reviewer: currentUser.name,
    });
    setOpenId(null);
    setComment('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">审批中心</h2>
          <p className="text-gray-400 text-sm mt-1">生物力学研究员一级审批 · 主任医师二级审批 · 推送手术规划</p>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-space-dark border border-medical-cyan/10">
          {(['pending', 'done'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f ? 'bg-medical-cyan/20 text-medical-cyan' : 'text-gray-400 hover:text-white'
              }`}>
              {f === 'pending' ? `待审批 (${pending.length})` : `已完成 (${done.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard label="待一级审批" value={pending.filter(t => t.approvalStatus === 'pending').length} icon={Shield} color="cyan" />
        <StatCard label="待二级审批" value={pending.filter(t => t.approvalStatus === 'level1_approved').length} icon={Shield} color="orange" />
        <StatCard label="已推送手术" value={tasks.filter(t => t.approvalStatus === 'pushed_to_surgery').length} icon={CheckCircle2} color="cyan" />
      </div>

      <div className="space-y-3">
        {list.map(task => (
          <ApprovalCard
            key={task.id}
            task={task}
            open={openId === task.id}
            onOpen={() => setOpenId(openId === task.id ? null : task.id)}
            onApprove={() => approve(task.id, myLevel)}
            onReject={() => reject(task.id, myLevel)}
            onPush={() => pushToSurgery(task.id)}
            comment={comment}
            setComment={setComment}
            myLevel={myLevel}
          />
        ))}
        {list.length === 0 && (
          <div className="glass-card rounded-2xl p-16 text-center">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{filter === 'pending' ? '暂无待审批任务' : '暂无已完成审批'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ApprovalCard({ task, open, onOpen, onApprove, onReject, onPush, comment, setComment, myLevel }: any) {
  const canApproveLevel1 = task.approvalStatus === 'pending' && myLevel <= 1;
  const canApproveLevel2 = task.approvalStatus === 'level1_approved' && myLevel <= 2;
  const canPush = task.approvalStatus === 'level2_approved';

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-5 flex items-center gap-5 cursor-pointer" onClick={onOpen}>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-medical-cyan/20 to-medical-cyan/5 border border-medical-cyan/20 flex items-center justify-center">
          <FileText className="w-6 h-6 text-medical-cyan" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-lg font-semibold text-white">{task.caseName}</h3>
            <ApprovalBadge status={task.approvalStatus} />
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{task.patientName} · {task.vesselType}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 提交于 {new Date(task.updatedAt).toLocaleString('zh-CN')}</span>
            {task.recommendedStents && (
              <span>推荐方案 {task.recommendedStents.length} 套 · 最优评分 {task.recommendedStents[0].score}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/tasks/${task.id}/report`} onClick={e => e.stopPropagation()}
            className="px-4 py-2 rounded-xl bg-white/5 text-white text-sm hover:bg-white/10">
            查看报告
          </Link>
        </div>
      </div>

      {task.approvals?.length > 0 && (
        <div className="px-5 pb-3">
          <div className="flex gap-6 pl-17">
            {task.approvals.map((a: any) => (
              <div key={a.id} className="flex items-center gap-2 text-xs">
                <User className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-400">{a.reviewer}</span>
                <span className="text-gray-500">第{a.level}级</span>
                {a.result === 'approved'
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  : <XCircle className="w-3.5 h-3.5 text-red-400" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className="px-5 pb-5 border-t border-medical-cyan/10 pt-4 space-y-4">
          {(canApproveLevel1 || canApproveLevel2) && (
            <>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">
                  审批意见（第{canApproveLevel1 ? 1 : 2}级审批 · {canApproveLevel1 ? '生物力学研究员' : '主任医师'}）
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="请填写审批意见..."
                  className="w-full px-4 py-3 rounded-xl bg-space-dark border border-medical-cyan/10 text-white text-sm focus:outline-none focus:border-medical-cyan/40 h-20 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={onReject} className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 text-sm hover:bg-white/10 border border-gray-600 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-alert-red" /> 驳回
                </button>
                <button onClick={onApprove} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-medical-cyan to-medical-cyan-dark text-space-deep font-semibold shadow-glow-cyan flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 通过审批
                </button>
              </div>
            </>
          )}
          {canPush && (
            <div className="p-4 rounded-xl bg-medical-cyan/5 border border-medical-cyan/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-medical-cyan" />
                <div>
                  <p className="text-sm text-white font-medium">二级审批已完成，可推送至手术规划系统</p>
                  <p className="text-xs text-gray-400 mt-0.5">推送后手术团队将收到通知并安排介入手术</p>
                </div>
              </div>
              <button onClick={onPush} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-medical-cyan to-medical-cyan-dark text-space-deep font-semibold shadow-glow-cyan flex items-center gap-1.5">
                <Send className="w-4 h-4" /> 推送手术规划
              </button>
            </div>
          )}
          {!canApproveLevel1 && !canApproveLevel2 && !canPush && task.approvalStatus === 'pending' && (
            <p className="text-center text-gray-500 text-sm py-4">需生物力学研究员进行一级审批</p>
          )}
          {!canApproveLevel1 && !canApproveLevel2 && !canPush && task.approvalStatus === 'level1_approved' && (
            <p className="text-center text-gray-500 text-sm py-4">需主任医师进行二级审批</p>
          )}
        </div>
      )}
    </div>
  );
}

function ApprovalBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: '待一级审批', cls: 'bg-blue-500/20 text-blue-400' },
    level1_approved: { label: '待二级审批', cls: 'bg-yellow-500/20 text-yellow-400' },
    level2_approved: { label: '待推送手术', cls: 'bg-emerald-500/20 text-emerald-400' },
    pushed_to_surgery: { label: '已推送手术', cls: 'bg-medical-cyan/20 text-medical-cyan' },
    rejected: { label: '已驳回', cls: 'bg-red-500/20 text-red-400' },
  };
  const s = map[status || ''];
  return s ? <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span> : null;
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const isCyan = color === 'cyan';
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isCyan ? 'bg-medical-cyan/15 text-medical-cyan' : 'bg-alert-orange/15 text-alert-orange'}`}>
          <Icon className="w-5.5 h-5.5" />
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className={`font-display text-2xl font-bold font-mono mt-1 ${isCyan ? 'text-medical-cyan glow-text' : 'text-alert-orange'}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
