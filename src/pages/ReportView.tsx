import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { ArrowLeft, Download, Award, CheckCircle2, FileText, Printer, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import VelocityField from '../components/VelocityField';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTask, fetchTask } = useAppStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedStent, setSelectedStent] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { if (id) fetchTask(id); }, [id, fetchTask]);

  if (!currentTask) return <div className="text-gray-400">加载中...</div>;
  const task = currentTask;

  const stressOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#0F2338', borderColor: '#00D4AA33', textStyle: { color: '#fff' } },
    legend: { textStyle: { color: '#aaa' }, top: 0, data: ['方案A(推荐)', '方案B', '方案C'] },
    grid: { left: 45, right: 20, top: 35, bottom: 35 },
    xAxis: { type: 'category', data: Array.from({ length: 20 }, (_, i) => `${i}s`),
      axisLine: { lineStyle: { color: '#00D4AA22' } }, axisLabel: { color: '#888' } },
    yAxis: { type: 'value', name: '应力 (Pa)', axisLine: { show: false },
      splitLine: { lineStyle: { color: '#00D4AA11' } }, axisLabel: { color: '#888' },
      markLine: { symbol: 'none', lineStyle: { color: '#FF4D6A', type: 'dashed' }, data: [{ yAxis: task.stressThreshold }] } },
    series: [
      { name: '方案A(推荐)', type: 'line', smooth: true, data: Array.from({ length: 20 }, (_, i) => 2 + Math.sin(i / 3) * 0.8 + Math.random() * 0.3),
        itemStyle: { color: '#00D4AA' }, lineStyle: { width: 3 }, areaStyle: { color: '#00D4AA22' } },
      { name: '方案B', type: 'line', smooth: true, data: Array.from({ length: 20 }, (_, i) => 1.7 + Math.sin(i / 3 + 0.5) * 0.7 + Math.random() * 0.3),
        itemStyle: { color: '#FFB547' }, lineStyle: { width: 2 } },
      { name: '方案C', type: 'line', smooth: true, data: Array.from({ length: 20 }, (_, i) => 1.5 + Math.sin(i / 3 + 1) * 0.6 + Math.random() * 0.3),
        itemStyle: { color: '#5B8FF9' }, lineStyle: { width: 2 } },
    ],
  };

  const stressDistOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#0F2338', borderColor: '#00D4AA33', textStyle: { color: '#fff' } },
    grid: { left: 45, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: ['0-1Pa', '1-2Pa', '2-3Pa', '3-4Pa', '4-5Pa', '>5Pa'],
      axisLine: { lineStyle: { color: '#00D4AA22' } }, axisLabel: { color: '#888' } },
    yAxis: { type: 'value', name: '占比 (%)', axisLine: { show: false }, splitLine: { lineStyle: { color: '#00D4AA11' } }, axisLabel: { color: '#888' } },
    series: [{
      type: 'bar', data: [8, 22, 38, 20, 9, 3], barWidth: 30,
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: (p: any) => ['#FF4D6A', '#FF7A45', '#FFB547', '#00D4AA', '#00D4AA', '#5B8FF9'][p.dataIndex],
      },
    }],
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { backgroundColor: '#0B1929', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${task.caseName}_血流动力学报告.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-white">模拟报告</h2>
          <p className="text-gray-400 text-sm mt-1">{task.caseName} · {task.patientName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 text-gray-300 text-sm hover:bg-white/10">
            <Printer className="w-4 h-4" /> 打印
          </button>
          <button onClick={exportPDF} disabled={exporting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-medical-cyan to-medical-cyan-dark text-space-deep font-semibold shadow-glow-cyan disabled:opacity-60">
            <Download className="w-4 h-4" /> {exporting ? '生成中...' : '导出 PDF'}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-5">
        <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-medical-cyan/25 to-medical-cyan/5 flex items-center justify-center shadow-glow-cyan border border-medical-cyan/30">
            <FileText className="w-8 h-8 text-medical-cyan" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-white glow-text">心血管血流动力学模拟与支架优化报告</h1>
            <div className="grid grid-cols-4 gap-6 mt-3 text-sm">
              <div><p className="text-gray-400">病例编号</p><p className="text-white font-medium">{task.caseName}</p></div>
              <div><p className="text-gray-400">患者姓名</p><p className="text-white font-medium">{task.patientName}</p></div>
              <div><p className="text-gray-400">血管类型</p><p className="text-white font-medium">{task.vesselType}</p></div>
              <div><p className="text-gray-400">报告时间</p><p className="text-white font-medium">{new Date().toLocaleString('zh-CN')}</p></div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">审核状态</p>
            <p className={`text-sm font-medium mt-0.5 ${(task.surgeryPushed || task.approvalStatus === 'pushed_to_surgery') ? 'text-medical-cyan' : task.approvalStatus === 'level2_approved' ? 'text-medical-cyan' : 'text-alert-orange'}`}>
              {task.surgeryPushed || task.approvalStatus === 'pushed_to_surgery' ? '✅ 已推送手术规划' :
               task.approvalStatus === 'pending' || !task.approvalStatus ? '待一级审批' :
               task.approvalStatus === 'level1_approved' ? '待二级审批' :
               task.approvalStatus === 'level2_approved' ? '二级审批通过' : '已驳回'}
            </p>
            {(task.surgeryPushed || task.approvalStatus === 'pushed_to_surgery') && task.surgeryPushedAt && (
              <p className="text-[10px] text-gray-500 font-mono mt-1">推送时间：{task.surgeryPushedAt.slice(0, 19).replace('T', ' ')}</p>
            )}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-medical-cyan" />
            <h3 className="font-display font-semibold text-white">血流速度场模拟结果</h3>
          </div>
          <div className="flex justify-center bg-space-dark/50 rounded-xl p-4">
            <VelocityField threshold={task.stressThreshold} width={780} height={380} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-display font-semibold text-white mb-3">壁面剪切应力 - 时间曲线</h3>
            <ReactECharts option={stressOption} style={{ height: 240 }} />
          </div>
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-display font-semibold text-white mb-3">壁面应力分布</h3>
            <ReactECharts option={stressDistOption} style={{ height: 240 }} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Award className="w-5 h-5 text-alert-yellow" />
            <h3 className="font-display font-semibold text-white">AI 推荐支架方案</h3>
            <span className="ml-auto text-xs text-gray-400">基于推荐引擎综合评分排序</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {task.recommendedStents?.map((s, i) => (
              <div key={s.id} onClick={() => setSelectedStent(i)}
                className={`relative p-5 rounded-2xl cursor-pointer transition-all ${
                  selectedStent === i
                    ? 'bg-gradient-to-br from-medical-cyan/15 to-medical-cyan/5 border-2 border-medical-cyan/50 shadow-glow-cyan scale-[1.02]'
                    : 'bg-space-dark/60 border border-gray-700 hover:border-medical-cyan/30'
                }`}>
                {i === 0 && (
                  <span className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-alert-yellow to-alert-orange text-space-deep text-xs font-bold">
                    最优推荐
                  </span>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">方案 {String.fromCharCode(65 + i)}</span>
                  <span className={`font-display text-2xl font-bold ${selectedStent === i ? 'text-medical-cyan glow-text' : 'text-white'}`}>
                    {s.score}<span className="text-sm text-gray-500 ml-0.5">/100</span>
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">支架直径</span><span className="text-white font-mono">{s.config.diameter} mm</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">支架长度</span><span className="text-white font-mono">{s.config.length} mm</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">释放位置</span><span className="text-white font-mono">{s.config.position}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">网格密度</span><span className="text-white font-mono">Level {s.config.meshDensity}</span></div>
                  <div className="h-px bg-gray-700 my-2" />
                  <div className="flex justify-between"><span className="text-gray-400">平均应力</span><span className="text-medical-cyan font-mono">{s.avgStress.toFixed(2)} Pa</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">低应力面积</span><span className={`font-mono ${s.lowStressArea < 2 ? 'text-medical-cyan' : 'text-alert-orange'}`}>{s.lowStressArea.toFixed(2)}%</span></div>
                </div>
                {selectedStent === i && (
                  <div className="mt-3 pt-3 border-t border-medical-cyan/20 flex items-center gap-1.5 text-medical-cyan text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 已选择此方案
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-semibold text-white mb-4">审批记录</h3>
          <div className="space-y-3">
            {task.approvals?.map(a => (
              <div key={a.id} className="flex items-start gap-4 p-4 rounded-xl bg-space-dark/50 border border-medical-cyan/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-medical-cyan/20 to-medical-cyan/5 flex items-center justify-center border border-medical-cyan/20">
                  <span className="text-medical-cyan text-sm font-bold">{a.reviewer.slice(-1)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{a.reviewer}</span>
                    <span className="px-2 py-0.5 rounded-full bg-medical-cyan/15 text-medical-cyan text-[10px]">
                      第{a.level}级审批
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${a.result === 'approved' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {a.result === 'approved' ? '通过' : '驳回'}
                    </span>
                    <span className="ml-auto text-xs text-gray-500 font-mono">{new Date(a.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1.5">审批意见：{a.comment}</p>
                </div>
              </div>
            ))}
            {(!task.approvals || task.approvals.length === 0) && (
              <p className="text-center text-gray-500 py-6 text-sm">暂无审批记录</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link to="/approvals" className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 text-sm hover:bg-white/10">
          前往审批中心
        </Link>
      </div>
    </div>
  );
}
