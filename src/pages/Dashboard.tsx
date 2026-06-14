import { useEffect, useState, useMemo, useRef } from 'react';
import { Activity, AlertTriangle, TrendingUp, PieChart, Gauge, RefreshCw, Zap, Target, ShieldAlert, User, CheckCircle2, Clock, XCircle, ArrowRight, ArrowUp, ArrowDown, RotateCcw, X, MessageSquare } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../store/useAppStore';

export default function Dashboard() {
  const { stats, tasks, warnings, fetchAll, permissions, pausedVessels, resolvePausedVessel, currentUser } = useAppStore();
  const [showResolveModal, setShowResolveModal] = useState<any>(null);
  const refreshRef = useRef<number | null>(null);

  useEffect(() => {
    fetchAll();
    refreshRef.current = window.setInterval(() => fetchAll(), 5000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [fetchAll]);

  const recent = [...tasks].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const trendOption = useMemo(() => ({
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(11,25,41,0.95)', borderColor: 'rgba(0,212,170,0.3)', textStyle: { color: '#fff' } },
    xAxis: { type: 'category', boundaryGap: false, data: ['周一','周二','周三','周四','周五','周六','今日'], axisLine: { lineStyle: { color: 'rgba(0,212,170,0.15)' } }, axisLabel: { color: '#9CA3AF', fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(0,212,170,0.08)' } }, axisLabel: { color: '#9CA3AF', fontSize: 11, formatter: '{value}%' } },
    series: [{
      name: '完成率', type: 'line', smooth: true, symbolSize: 8, data: [62, 68, 71, 74, 78, 82, stats?.completionRate || 0],
      lineStyle: { width: 3, color: '#00D4AA' }, itemStyle: { color: '#00D4AA', borderColor: '#0B1929', borderWidth: 3 },
      areaStyle: { color: { type: 'linear', x:0, y:0, x2:0, y2:1, colorStops: [{ offset:0, color:'rgba(0,212,170,0.35)' }, { offset:1, color:'rgba(0,212,170,0.02)' }] } },
    }],
  }), [stats?.completionRate]);

  const pieOption = useMemo(() => ({
    tooltip: { backgroundColor: 'rgba(11,25,41,0.95)', borderColor: 'rgba(0,212,170,0.3)', textStyle: { color: '#fff' } },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#9CA3AF', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    series: [{
      type: 'pie', radius: ['55%', '78%'], center: ['38%', '50%'], avoidLabelOverlap: true,
      label: { show:false }, labelLine: { show:false }, itemStyle: { borderColor: '#0B1929', borderWidth: 2 },
      data: [
        { value: tasks.filter((t: any) => t.status === 'pending').length, name: '待校验', itemStyle: { color: '#F59E0B' } },
        { value: tasks.filter((t: any) => ['meshing','computing','optimizing'].includes(t.status)).length, name: '计算中', itemStyle: { color: '#00D4AA' } },
        { value: tasks.filter((t: any) => t.status === 'completed').length, name: '已完成', itemStyle: { color: '#10B981' } },
        { value: tasks.filter((t: any) => t.status === 'error').length, name: '异常', itemStyle: { color: '#EF4444' } },
      ].filter((x: any) => x.value > 0),
    }],
  }), [tasks]);

  const stressTrend = useMemo(() => ({
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(11,25,41,0.95)', borderColor: 'rgba(0,212,170,0.3)', textStyle: { color: '#fff' } },
    xAxis: { type: 'category', boundaryGap: false, data: recent.map((t: any) => t.id), axisLine: { lineStyle: { color: 'rgba(0,212,170,0.15)' } }, axisLabel: { color: '#9CA3AF', fontSize: 10, rotate: 30 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(0,212,170,0.08)' } }, axisLabel: { color: '#9CA3AF', fontSize: 11, formatter: '{value}Pa' } },
    series: [{
      name: '推荐WSS', type: 'bar', barWidth: '45%',
      data: recent.map((t: any) => t.stressResult?.recommended?.avgStressPa || t.stressResult?.maxStressPa || 1.8),
      itemStyle: { borderRadius: [4,4,0,0], color: { type:'linear', x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:'#00D4AA'},{offset:1,color:'rgba(0,212,170,0.2)'}] } },
    }],
  }), [recent]);

  const pendingList = pausedVessels.filter((p: any) => p.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white glow-text">数据看板</h1>
          <p className="text-gray-400 text-sm mt-1">实时监控 · 每 5 秒自动刷新 · {new Date().toLocaleString('zh-CN')}</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 glass-card border border-medical-cyan/20 rounded-xl text-gray-300 hover:text-medical-cyan hover:border-medical-cyan/40 transition">
          <RefreshCw className="w-4 h-4" /> 立即刷新
        </button>
      </div>

      {permissions.canManagePausedVessels && pendingList.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border-2 border-alert-red/40 bg-alert-red/5 shadow-glow-red animate-pulse-slow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-alert-red/15 border border-alert-red/30 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6 text-alert-red" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h2 className="text-white font-bold text-lg">首席科学家 · 待处理暂停血管</h2>
                <span className="px-2 py-0.5 rounded-full bg-alert-red/20 text-alert-red text-xs font-semibold">{pendingList.length} 条待处理</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">以下血管因连续三次低应力区超标被系统暂停受理，请及时评估处理以恢复该血管的新建任务资格</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {pendingList.map((p: any) => (
                  <div key={p.id} className="glass-card rounded-xl p-4 border border-alert-red/20">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-semibold">{p.vesselType}</p>
                        <p className="text-xs text-gray-400 mt-0.5">连续超标 {p.offenseCount} 次 · {p.relatedTaskIds.length} 个关联任务</p>
                      </div>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-alert-red/15 text-alert-red text-xs border border-alert-red/25">
                        <Clock className="w-3 h-3" /> 已暂停
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono mb-3">暂停时间：{p.suspendedAt?.slice(0,19).replace('T',' ')}</p>
                    <button onClick={() => setShowResolveModal(p)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-medical-cyan/10 text-medical-cyan text-sm font-medium hover:bg-medical-cyan/20 border border-medical-cyan/25">
                      <ShieldAlert className="w-4 h-4" /> 解除暂停并恢复受理
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Target} label="模拟完成率" value={`${stats?.completionRate ?? 0}%`} delta="+4.2%" tone="cyan" desc={`${stats?.todayTasks ?? 0} 任务 / ${tasks.filter((t: any) => t.status === 'completed').length} 已完成`} />
        <StatCard icon={Gauge} label="平均壁面应力" value={`${(stats?.avgWSSPa ?? stats?.avgStress ?? 0).toFixed(2)} Pa`} delta="+0.18Pa" tone="green" desc="已完成任务方案均值" />
        <StatCard icon={Zap} label="支架优化次数" value={stats?.optimizationCount ?? 0} delta="+3" tone="amber" desc="含调整量+告警+参数优化" />
        <StatCard icon={Activity} label="待审批总数" value={stats?.pendingApprovals ?? 0} delta={stats?.pendingApprovals ? `+${stats.pendingApprovals}` : '0'} tone="red" desc={`待一级+待二级 · 预警待复核 ${stats?.activeWarnings ?? 0}`} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 glass-card rounded-2xl p-6 border border-medical-cyan/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-medical-cyan" /> 模拟完成率趋势</h3>
            <span className="text-xs text-medical-cyan/70">近 7 日</span>
          </div>
          <ReactECharts option={trendOption} style={{ height: 280 }} />
        </div>
        <div className="glass-card rounded-2xl p-6 border border-medical-cyan/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2"><PieChart className="w-4 h-4 text-medical-cyan" /> 任务状态分布</h3>
            <span className="text-xs text-medical-cyan/70">共 {tasks.length}</span>
          </div>
          <ReactECharts option={pieOption} style={{ height: 280 }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6 border border-medical-cyan/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2"><Gauge className="w-4 h-4 text-medical-cyan" /> 近期任务应力</h3>
            <span className="text-xs text-medical-cyan/70">Pa</span>
          </div>
          <ReactECharts option={stressTrend} style={{ height: 240 }} />
        </div>

        <div className="glass-card rounded-2xl p-6 border border-medical-cyan/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning-amber" /> 预警告警</h3>
            <span className="px-2 py-0.5 rounded-full text-xs bg-alert-red/15 text-alert-red border border-alert-red/25">{warnings.filter((w: any) => !w.reviewResult).length} 未处理</span>
          </div>
          <div className="space-y-2.5 max-h-[240px] overflow-auto pr-1">
            {warnings.slice(0, 5).map((w: any) => (
              <div key={w.id} className="p-3 rounded-lg bg-space-deep/50 border border-medical-cyan/8">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-white">{w.taskId}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${w.reviewResult === 'approve_adjust' ? 'bg-success-green/15 text-success-green' : w.reviewResult === 'reject' ? 'bg-alert-red/15 text-alert-red' : 'bg-warning-amber/15 text-warning-amber'}`}>
                    {!w.reviewResult ? '待复核' : w.reviewResult === 'approve_adjust' ? '已调整' : '已驳回'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">{w.message}</p>
                <p className="text-[10px] text-gray-600 font-mono mt-1">{w.createdAt?.slice(0,19).replace('T',' ')}</p>
              </div>
            ))}
            {warnings.length === 0 && <p className="text-sm text-gray-500 text-center py-8">暂无预警</p>}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-medical-cyan/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-medical-cyan" /> 最近任务</h3>
          </div>
          <div className="space-y-2.5 max-h-[240px] overflow-auto pr-1">
            {recent.map((t: any) => {
              const statusC = ({pending:'text-warning-amber bg-warning-amber/15',meshing:'text-medical-cyan bg-medical-cyan/15',computing:'text-medical-cyan bg-medical-cyan/15',optimizing:'text-warning-amber bg-warning-amber/15',completed:'text-success-green bg-success-green/15',error:'text-alert-red bg-alert-red/15'})[t.status];
              const Ic = ({pending:Clock,meshing:RefreshCw,computing:RefreshCw,optimizing:Zap,completed:CheckCircle2,error:XCircle})[t.status];
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-space-deep/50 border border-medical-cyan/8 hover:border-medical-cyan/25 transition">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusC}`}>{<Ic className="w-4 h-4" />}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{t.caseName}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{t.patientName} · {t.vesselType}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-medical-cyan font-mono font-semibold">{t.progress}%</p>
                    <div className="w-16 h-1.5 rounded-full bg-space-deep mt-1 overflow-hidden">
                      <div className="h-full bg-medical-cyan" style={{ width: `${t.progress}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showResolveModal && (
        <ResolvePausedModal record={showResolveModal} onClose={() => setShowResolveModal(null)} onResolve={(d: any) => resolvePausedVessel(showResolveModal.id, d).then(() => setShowResolveModal(null))} currentUser={currentUser} />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delta, tone, desc }: any) {
  const isUp = delta && delta.startsWith('+');
  const tones: Record<string, any> = {
    cyan: { ic: 'text-medical-cyan', bd: 'border-medical-cyan/25', bg: 'bg-medical-cyan/10', val: 'text-medical-cyan' },
    green: { ic: 'text-success-green', bd: 'border-success-green/25', bg: 'bg-success-green/10', val: 'text-success-green' },
    amber: { ic: 'text-warning-amber', bd: 'border-warning-amber/25', bg: 'bg-warning-amber/10', val: 'text-warning-amber' },
    red: { ic: 'text-alert-red', bd: 'border-alert-red/25', bg: 'bg-alert-red/10', val: 'text-alert-red' },
  }[tone];
  return (
    <div className="glass-card rounded-2xl p-5 border border-medical-cyan/10 hover:shadow-glow-cyan transition">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${tones.bd} ${tones.bg}`}>
          <Icon className={`w-5 h-5 ${tones.ic}`} />
        </div>
        {delta && (
          <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${isUp ? 'bg-success-green/10 text-success-green' : 'bg-alert-red/10 text-alert-red'}`}>
            {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{delta}
          </span>
        )}
      </div>
      <p className="text-3xl font-display font-bold text-white glow-text mb-1">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xs text-gray-600 mt-1.5">{desc}</p>
    </div>
  );
}

function ResolvePausedModal({ record, onClose, onResolve, currentUser }: any) {
  const [resolution, setResolution] = useState(record.recommendedResolution || '建议对该血管段支架参数进行优化，使用长支架+扩张策略');
  const [allowNewTasks, setAllowNewTasks] = useState(true);
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl w-full max-w-xl border border-medical-cyan/20 shadow-card overflow-hidden">
        <div className="p-6 border-b border-medical-cyan/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-medical-cyan" /> 解除血管暂停</h2>
            <p className="text-gray-400 text-sm mt-1">操作人：{currentUser.name}（首席科学家）</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-space-deep/60 border border-medical-cyan/10">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[10px] text-gray-500 uppercase">血管</p><p className="text-white font-medium">{record.vesselType}</p></div>
              <div><p className="text-[10px] text-gray-500 uppercase">超标次数</p><p className="text-white font-medium">{record.offenseCount} 次</p></div>
              <div><p className="text-[10px] text-gray-500 uppercase">暂停时间</p><p className="text-white font-mono text-xs">{record.suspendedAt?.slice(0,19).replace('T',' ')}</p></div>
              <div><p className="text-[10px] text-gray-500 uppercase">关联任务</p><p className="text-white font-medium">{record.relatedTaskIds.length} 个</p></div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5 mb-2"><MessageSquare className="w-4 h-4 text-medical-cyan" /> 处理意见 / 备注</label>
            <textarea rows={4} value={resolution} onChange={e => setResolution(e.target.value)} className="w-full px-4 py-3 bg-space-deep/70 border border-medical-cyan/15 rounded-xl text-white focus:border-medical-cyan/60 focus:outline-none" />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-xl bg-space-deep/40 border border-medical-cyan/10 cursor-pointer">
            <input type="checkbox" checked={allowNewTasks} onChange={e => setAllowNewTasks(e.target.checked)} className="w-4 h-4 accent-medical-cyan" />
            <div className="flex-1">
              <p className="text-sm text-white font-medium">同时恢复该血管的新建任务受理</p>
              <p className="text-xs text-gray-500">取消勾选则仅记录处理意见，但新建任务仍会停在"待校验"</p>
            </div>
            <ArrowRight className="w-4 h-4 text-medical-cyan" />
          </label>
        </div>
        <div className="p-6 border-t border-medical-cyan/10 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 border border-medical-cyan/20 rounded-xl text-gray-300 hover:bg-white/5 transition">取消</button>
          <button onClick={() => onResolve({ resolution, allowNewTasks })} className="flex-1 px-4 py-3 bg-gradient-to-r from-medical-cyan to-medical-cyan-dark text-space-deep rounded-xl font-semibold shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition">
            确认解除暂停
          </button>
        </div>
      </div>
    </div>
  );
}
