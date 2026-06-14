import { useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Activity, AlertTriangle, CheckCircle2, Clock, TrendingUp, Zap, Gauge, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { stats, tasks, warnings, fetchAll, loading } = useAppStore();

  useEffect(() => {
    fetchAll();
    const itv = setInterval(fetchAll, 5000);
    return () => clearInterval(itv);
  }, [fetchAll]);

  const statCards = [
    { label: '今日任务', value: stats?.todayTasks || 0, suffix: '个', icon: Activity, color: 'cyan', delta: '+12%', trend: 'up' },
    { label: '任务完成率', value: stats?.completionRate || 0, suffix: '%', icon: CheckCircle2, color: 'cyan', delta: '+3.2%', trend: 'up' },
    { label: '平均壁面应力', value: stats?.avgStress || 0, suffix: 'Pa', icon: Gauge, color: 'orange', delta: '-0.3Pa', trend: 'down' },
    { label: '累计优化次数', value: stats?.optimizationCount || 0, suffix: '次', icon: Zap, color: 'cyan', delta: '+8', trend: 'up' },
  ];

  const trendOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#0F2338', borderColor: '#00D4AA33', textStyle: { color: '#fff' } },
    legend: { textStyle: { color: '#888' }, top: 0, right: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: stats?.trend.map(d => d.date.slice(5)) || [],
      axisLine: { lineStyle: { color: '#00D4AA22' } },
      axisLabel: { color: '#888' },
    },
    yAxis: [
      { type: 'value', name: '完成率 %', axisLine: { show: false }, splitLine: { lineStyle: { color: '#00D4AA11' } }, axisLabel: { color: '#888' } },
      { type: 'value', name: '平均应力 Pa', axisLine: { show: false }, splitLine: { show: false }, axisLabel: { color: '#888' } },
    ],
    series: [
      { name: '完成率', type: 'line', smooth: true, data: stats?.trend.map(d => d.completionRate) || [], itemStyle: { color: '#00D4AA' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#00D4AA44' }, { offset: 1, color: '#00D4AA00' }] } },
        lineStyle: { width: 3 } },
      { name: '平均应力', type: 'bar', yAxisIndex: 1, data: stats?.trend.map(d => d.avgStress) || [], itemStyle: { color: '#FF7A4599', borderRadius: [4, 4, 0, 0] }, barWidth: 14 },
      { name: '优化次数', type: 'line', smooth: true, data: stats?.trend.map(d => d.optimizationCount) || [], itemStyle: { color: '#FFB547' }, lineStyle: { width: 2, type: 'dashed' } },
    ],
  };

  const statusDistribution = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: '#0F2338', borderColor: '#00D4AA33', textStyle: { color: '#fff' } },
    legend: { bottom: 0, textStyle: { color: '#888' } },
    series: [{
      type: 'pie', radius: ['55%', '78%'], center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#0F2338', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: tasks.filter(t => t.status === 'completed').length, name: '已完成', itemStyle: { color: '#00D4AA' } },
        { value: tasks.filter(t => t.status === 'computing' || t.status === 'meshing' || t.status === 'optimizing').length, name: '计算中', itemStyle: { color: '#FFB547' } },
        { value: tasks.filter(t => t.status === 'pending').length, name: '待校验', itemStyle: { color: '#5B8FF9' } },
        { value: tasks.filter(t => t.status === 'error').length, name: '异常', itemStyle: { color: '#FF4D6A' } },
      ],
    }],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">数据看板</h2>
          <p className="text-gray-400 text-sm mt-1">心血管血流动力学模拟与支架优化 · 全局运行状态</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-4 h-4" />
          <span>自动刷新 · 5s</span>
          {loading && <span className="text-medical-cyan animate-pulse">同步中...</span>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const isCyan = card.color === 'cyan';
          return (
            <div key={i} className="glass-card rounded-2xl p-5 hover:shadow-glow-cyan transition-all duration-500 group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400">{card.label}</p>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className={`font-display text-3xl font-bold font-mono ${isCyan ? 'text-medical-cyan glow-text' : 'text-alert-orange'}`}>
                      {card.value}
                    </span>
                    <span className="text-xs text-gray-500">{card.suffix}</span>
                  </div>
                  <div className={`mt-2 flex items-center gap-1 text-xs ${card.trend === 'up' ? 'text-medical-cyan' : 'text-alert-orange'}`}>
                    {card.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{card.delta}</span>
                    <span className="text-gray-500">较昨日</span>
                  </div>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isCyan ? 'bg-medical-cyan/15 text-medical-cyan' : 'bg-alert-orange/15 text-alert-orange'}`}>
                  <Icon className="w-5.5 h-5.5" strokeWidth={2} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-white">近7日运行趋势</h3>
              <p className="text-xs text-gray-400 mt-0.5">完成率 · 平均壁面应力 · 支架优化次数</p>
            </div>
            <TrendingUp className="w-5 h-5 text-medical-cyan" />
          </div>
          <ReactECharts option={trendOption} style={{ height: 280 }} />
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-white">任务状态分布</h3>
          <p className="text-xs text-gray-400 mt-0.5 mb-2">当前共 {tasks.length} 个模拟任务</p>
          <ReactECharts option={statusDistribution} style={{ height: 220 }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-alert-orange" />
              <h3 className="font-display font-semibold text-white">实时预警</h3>
              <span className="px-2 py-0.5 rounded-full bg-alert-red/20 text-alert-red text-xs font-medium">
                {warnings.filter(w => !w.reviewResult).length} 未处理
              </span>
            </div>
            <Link to="/tasks" className="text-xs text-medical-cyan hover:underline">查看全部 →</Link>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {warnings.slice(0, 4).map(w => (
              <div key={w.id} className={`p-3 rounded-xl border ${w.severity === 'critical' ? 'border-alert-red/30 bg-alert-red/5' : 'border-alert-orange/20 bg-alert-orange/5'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${w.severity === 'critical' ? 'bg-alert-red animate-pulse' : 'bg-alert-orange'}`} />
                  <span className={`text-xs font-medium ${w.severity === 'critical' ? 'text-alert-red' : 'text-alert-orange'}`}>
                    {w.severity === 'critical' ? '严重告警' : '低应力预警'}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">Task {w.taskId.slice(0, 6)}</span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">{w.message}</p>
              </div>
            ))}
            {warnings.length === 0 && <p className="text-center text-gray-500 py-8 text-sm">暂无预警</p>}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">最近任务</h3>
            <Link to="/tasks" className="text-xs text-medical-cyan hover:underline">任务管理 →</Link>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 4).map(t => (
              <Link key={t.id} to={`/tasks/${t.id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-cyan/20 to-medical-cyan/5 border border-medical-cyan/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-medical-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{t.caseName}</p>
                  <p className="text-xs text-gray-400">{t.patientName} · {t.vesselType}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={t.status} />
                  <p className="text-xs text-gray-500 mt-1 font-mono">{t.progress}%</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
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
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s?.cls}`}>{s?.label}</span>;
}
