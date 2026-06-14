import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FolderKanban, Activity, Clock, ChevronRight, Droplets, Search } from 'lucide-react';

export default function CaseArchive() {
  const { cases, tasks, fetchAll } = useAppStore();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const vesselStats: Record<string, { total: number; completed: number; avgScore: number; lowStress: number }> = {};
  tasks.forEach(t => {
    if (!vesselStats[t.vesselType]) vesselStats[t.vesselType] = { total: 0, completed: 0, avgScore: 0, lowStress: 0 };
    vesselStats[t.vesselType].total++;
    if (t.status === 'completed') vesselStats[t.vesselType].completed++;
    if (t.recommendedStents?.[0]) vesselStats[t.vesselType].avgScore += t.recommendedStents[0].score;
    vesselStats[t.vesselType].lowStress += t.lowStressCount;
  });
  Object.keys(vesselStats).forEach(k => {
    const s = vesselStats[k];
    if (s.completed > 0) s.avgScore = Math.round(s.avgScore / s.completed);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">病例档案</h2>
          <p className="text-gray-400 text-sm mt-1">血管三维几何数据管理 · 血液参数配置 · 历史模拟记录</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            placeholder="搜索病例..."
            className="pl-10 pr-4 py-2.5 rounded-xl bg-space-dark border border-medical-cyan/10 text-white text-sm focus:outline-none focus:border-medical-cyan/40 w-72 placeholder-gray-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <InfoCard label="累计病例" value={cases.length} icon={FolderKanban} />
        <InfoCard label="累计模拟" value={tasks.length} icon={Activity} />
        <InfoCard label="完成率" value={`${Math.round(tasks.filter(t => t.status === 'completed').length / Math.max(1, tasks.length) * 100)}%`} icon={ChevronRight} />
        <InfoCard label="血管类型" value={Object.keys(vesselStats).length} icon={Droplets} />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-semibold text-white mb-5">血管类型统计</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(vesselStats).map(([vessel, s]) => (
            <div key={vessel} className="p-5 rounded-xl bg-space-dark/60 border border-medical-cyan/10 hover:border-medical-cyan/30 transition">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-white">{vessel}</h4>
                  <p className="text-xs text-gray-500 mt-1">模拟 {s.total} 次 · 完成 {s.completed} 次</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">平均推荐评分</p>
                  <p className="font-mono text-medical-cyan text-lg font-bold glow-text">{s.avgScore || '-'}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-space-dark overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-medical-cyan to-medical-cyan-light rounded-full"
                    style={{ width: `${Math.round(s.completed / Math.max(1, s.total) * 100)}%` }} />
                </div>
                <span className="text-xs text-gray-400 font-mono w-10 text-right">
                  {Math.round(s.completed / Math.max(1, s.total) * 100)}%
                </span>
              </div>
              {s.lowStress >= 3 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-alert-red">
                  <span className="w-1.5 h-1.5 rounded-full bg-alert-red animate-pulse" />
                  已触发连续三次低应力告警，该血管新任务已暂停
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-medical-cyan/10">
          <h3 className="font-display font-semibold text-white">病例列表</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-400 bg-space-dark/50">
            <tr>
              <th className="text-left px-6 py-3 font-medium">病例编号</th>
              <th className="text-left px-6 py-3 font-medium">患者</th>
              <th className="text-left px-6 py-3 font-medium">血管类型</th>
              <th className="text-left px-6 py-3 font-medium">几何文件</th>
              <th className="text-left px-6 py-3 font-medium">关联任务</th>
              <th className="text-left px-6 py-3 font-medium">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {cases.map(c => {
              const related = tasks.filter(t => t.patientName === c.patientName || t.vesselType === c.vesselType);
              return (
                <tr key={c.id} className="border-t border-medical-cyan/5 hover:bg-white/5 transition">
                  <td className="px-6 py-4 text-medical-cyan font-mono">{c.id.toUpperCase()}</td>
                  <td className="px-6 py-4 text-white">{c.patientName}</td>
                  <td className="px-6 py-4 text-gray-300">{c.vesselType}</td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs">{c.geometryFile}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full bg-medical-cyan/15 text-medical-cyan text-xs">
                      {related.length} 个任务
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon: Icon }: any) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
        <Icon className="w-4 h-4 text-medical-cyan" />
        {label}
      </div>
      <p className="font-display text-2xl font-bold text-white font-mono">{value}</p>
    </div>
  );
}
