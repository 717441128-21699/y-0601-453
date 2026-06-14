import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { ArrowLeft, AlertTriangle, CheckCircle, FileText, Play, Droplets, Activity, Clock, User, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import StatusFlow from '../components/StatusFlow';
import VelocityField from '../components/VelocityField';
import StressHeatmap from '../components/StressHeatmap';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTask, fetchTask, currentUser, reviewWarning, startTask, loading } = useAppStore();
  const [reviewComment, setReviewComment] = useState('同意自动调整支架参数');

  useEffect(() => {
    if (id) fetchTask(id);
    const itv = setInterval(() => id && fetchTask(id), 3000);
    return () => clearInterval(itv);
  }, [id, fetchTask]);

  if (!currentTask) return <div className="text-gray-400">加载中...</div>;

  const task = currentTask;
  const needReview = task.warning && !task.warning.reviewResult;

  const stressOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#0F2338', borderColor: '#00D4AA33', textStyle: { color: '#fff' } },
    legend: { textStyle: { color: '#888' }, top: 0 },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: ['0s', '2s', '4s', '6s', '8s', '10s', '12s', '14s', '16s', '18s', '20s'],
      axisLine: { lineStyle: { color: '#00D4AA22' } }, axisLabel: { color: '#888' } },
    yAxis: { type: 'value', name: 'WSS Pa', min: 0, max: 5, axisLine: { show: false },
      splitLine: { lineStyle: { color: '#00D4AA11' } }, axisLabel: { color: '#888' } },
    series: [
      { name: '近端应力', type: 'line', smooth: true, data: [2.3, 2.5, 2.8, 2.6, 1.8, 1.2, 0.9, 1.1, 1.8, 2.2, 2.5],
        itemStyle: { color: '#00D4AA' }, lineStyle: { width: 2.5 }, areaStyle: { color: '#00D4AA15' },
        markLine: { symbol: 'none', lineStyle: { color: '#FF4D6A', type: 'dashed', width: 1.5 },
          data: [{ yAxis: task.stressThreshold, label: { formatter: `阈值 ${task.stressThreshold} Pa`, color: '#FF4D6A' } }] } },
      { name: '远端应力', type: 'line', smooth: true, data: [2.1, 2.3, 2.6, 2.4, 2.0, 1.6, 1.3, 1.5, 2.0, 2.3, 2.4],
        itemStyle: { color: '#FFB547' }, lineStyle: { width: 2 } },
      { name: '支架内应力', type: 'line', smooth: true, data: [3.1, 3.3, 3.5, 3.4, 3.0, 2.6, 2.3, 2.5, 3.0, 3.2, 3.4],
        itemStyle: { color: '#5B8FF9' }, lineStyle: { width: 2, type: 'dashed' } },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-bold text-white">{task.caseName}</h2>
            <StatusBadge status={task.status} />
            {loading && <RefreshCw className="w-4 h-4 text-medical-cyan animate-spin" />}
          </div>
          <p className="text-gray-400 text-sm mt-1">{task.patientName} · {task.vesselType}</p>
        </div>
        <div className="flex items-center gap-2">
          {task.status === 'pending' && !task.vesselPaused && (
            <button onClick={() => id && startTask(id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-medical-cyan/15 text-medical-cyan text-sm font-medium hover:bg-medical-cyan/25 border border-medical-cyan/20">
              <Play className="w-4 h-4" /> 启动模拟
            </button>
          )}
          {task.status === 'completed' && (
            <Link to={`/tasks/${id}/report`} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-medical-cyan to-medical-cyan-dark text-space-deep text-sm font-semibold shadow-glow-cyan">
              <FileText className="w-4 h-4" /> 查看完整报告
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <InfoCard label="血液粘度" value={`${task.bloodParams.viscosity} cP`} icon={Droplets} />
        <InfoCard label="血液密度" value={`${task.bloodParams.density} kg/m³`} icon={Activity} />
        <InfoCard label="入口流量" value={`${task.bloodParams.flowRate} mL/s`} icon={Droplets} />
        <InfoCard label="创建时间" value={new Date(task.createdAt).toLocaleString('zh-CN')} icon={Clock} />
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="col-span-1">
          <StatusFlow status={task.status} progress={task.progress} />
        </div>
        <div className="col-span-3 space-y-5">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white">血流速度场云图 (纵切面)</h3>
              <span className="text-xs text-gray-400 font-mono">实时模拟</span>
            </div>
            <div className="flex justify-center bg-space-dark/50 rounded-xl p-3">
              <VelocityField threshold={task.stressThreshold} width={720} height={360} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <StressHeatmap threshold={task.stressThreshold} />
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white">壁面剪切应力时间曲线</p>
                <p className="text-xs text-gray-400">单位: Pa</p>
              </div>
              <ReactECharts option={stressOption} style={{ height: 195 }} />
            </div>
          </div>
        </div>
      </div>

      {needReview && (
        <div className="glass-card rounded-2xl p-6 border-2 border-alert-orange/30 shadow-glow-orange">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-alert-orange/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-alert-orange animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-semibold text-alert-orange">工程师复核预警</h3>
                <span className="px-2 py-0.5 rounded-full bg-alert-orange/20 text-alert-orange text-xs font-medium">
                  {task.warning!.severity === 'critical' ? '严重' : '一般'}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-4">{task.warning!.message}</p>

              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1.5 block">复核意见</label>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-space-dark border border-medical-cyan/10 text-white text-sm focus:outline-none focus:border-medical-cyan/40 h-20 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => id && reviewWarning(id, { reviewResult: 'reject', reviewer: currentUser.name, comment: reviewComment })}
                  className="px-5 py-2 rounded-xl bg-white/5 text-gray-300 text-sm font-medium hover:bg-white/10 border border-gray-600"
                >
                  标记异常，不调整
                </button>
                <button
                  onClick={() => id && reviewWarning(id, { reviewResult: 'approve_adjust', reviewer: currentUser.name, comment: reviewComment })}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-alert-orange to-alert-yellow text-space-deep font-semibold shadow-glow-orange"
                >
                  <CheckCircle className="w-4 h-4 inline mr-1.5" />
                  复核通过，自动调整支架并重算
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {task.vesselPaused && (
        <div className="glass-card rounded-2xl p-6 border-2 border-alert-red/30 shadow-glow-red">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-alert-red" />
            <div>
              <p className="font-semibold text-alert-red">该血管已暂停新任务</p>
              <p className="text-sm text-gray-300 mt-1">同血管连续 {task.lowStressCount} 次低应力区超标，已自动通知首席科学家陈首席介入处理。</p>
            </div>
          </div>
        </div>
      )}

      {task.currentStentConfig && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-white mb-4">当前支架配置</h3>
          <div className="grid grid-cols-4 gap-4">
            <InfoMini label="支架直径" value={`${task.currentStentConfig.diameter} mm`} />
            <InfoMini label="支架长度" value={`${task.currentStentConfig.length} mm`} />
            <InfoMini label="释放位置" value={`${task.currentStentConfig.position}%`} />
            <InfoMini label="网格密度" value={`Level ${task.currentStentConfig.meshDensity}`} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: '待校验', cls: 'bg-blue-500/20 text-blue-400' },
    meshing: { label: '网格生成', cls: 'bg-purple-500/20 text-purple-400' },
    computing: { label: '血流计算', cls: 'bg-yellow-500/20 text-yellow-400' },
    optimizing: { label: '支架优化', cls: 'bg-orange-500/20 text-orange-400' },
    completed: { label: '已完成', cls: 'bg-emerald-500/20 text-emerald-400' },
    error: { label: '异常', cls: 'bg-red-500/20 text-red-400' },
  };
  const s = map[status];
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s?.cls}`}>{s?.label}</span>;
}

function InfoCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="font-mono text-lg text-white font-medium">{value}</p>
    </div>
  );
}

function InfoMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-space-dark/60 border border-medical-cyan/10">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-mono text-base text-medical-cyan mt-1">{value}</p>
    </div>
  );
}
