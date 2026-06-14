import { AlertTriangle, CheckCircle2, Clock, Cpu, GitBranch, Loader2, Rocket, XCircle } from 'lucide-react';
import { TaskStatus } from '../../shared/types';

const stages: { key: TaskStatus; label: string; desc: string; Icon: any }[] = [
  { key: 'pending', label: '待校验', desc: '数据完整性与格式校验', Icon: Clock },
  { key: 'meshing', label: '网格生成', desc: '体网格/面网格自动划分', Icon: GitBranch },
  { key: 'computing', label: '血流计算', desc: 'CFD求解器迭代计算', Icon: Cpu },
  { key: 'optimizing', label: '支架优化', desc: '几何参数迭代优化', Icon: Rocket },
  { key: 'completed', label: '完成', desc: '生成报告与推荐方案', Icon: CheckCircle2 },
  { key: 'error', label: '异常', desc: '计算异常或复核不通过', Icon: XCircle },
];

export default function StatusFlow({ status, progress }: { status: TaskStatus; progress: number }) {
  const currentIdx = stages.findIndex(s => s.key === status);

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-display font-semibold text-white mb-5">模拟状态流转</h3>
      <div className="relative">
        <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-medical-cyan/30 via-medical-cyan/15 to-medical-cyan/5 rounded" />

        <div className="space-y-5">
          {stages.map((stage, i) => {
            const Icon = stage.Icon;
            const isDone = i < currentIdx || (status === 'completed' && i <= currentIdx);
            const isCurrent = i === currentIdx && status !== 'completed' && status !== 'error';
            const isError = stage.key === 'error' && status === 'error';
            return (
              <div key={stage.key} className="relative flex items-start gap-4">
                <div className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  isDone ? 'bg-medical-cyan/20 border-2 border-medical-cyan text-medical-cyan shadow-glow-cyan' :
                  isCurrent ? 'bg-alert-orange/15 border-2 border-alert-orange text-alert-orange pulse-ring' :
                  isError ? 'bg-alert-red/15 border-2 border-alert-red text-alert-red' :
                  'bg-space-dark border border-gray-700 text-gray-600'
                }`}>
                  {isCurrent && stage.key === 'computing' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 pt-1.5">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm ${isDone || isCurrent || isError ? 'text-white' : 'text-gray-500'}`}>
                      {stage.label}
                    </p>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-alert-orange/20 text-alert-orange text-[10px] font-medium animate-pulse">
                        进行中 {progress}%
                      </span>
                    )}
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-medical-cyan" />}
                    {isError && <AlertTriangle className="w-3.5 h-3.5 text-alert-red" />}
                  </div>
                  <p className={`text-xs mt-0.5 ${isDone || isCurrent || isError ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
