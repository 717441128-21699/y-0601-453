import { useEffect, useRef } from 'react';

interface Props {
  threshold?: number;
  width?: number;
  height?: number;
  label?: string;
}

export default function StressHeatmap({ threshold = 1.5, width = 480, height = 220, label = '壁面剪切应力分布' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let frame = 0;
    let animId: number;

    const color = (v: number) => {
      if (v < threshold) return `rgba(255, 77, 106, ${0.2 + v / threshold * 0.5})`;
      const t = Math.min(1, (v - threshold) / 3);
      if (t < 0.33) return `rgb(0, ${Math.round(180 + t * 3 * 75)}, ${Math.round(170 - t * 3 * 50)})`;
      if (t < 0.66) return `rgb(${Math.round((t - 0.33) * 3 * 200)}, 255, ${Math.round(120 - (t - 0.33) * 3 * 80)})`;
      return `rgb(255, ${Math.round(255 - (t - 0.66) * 3 * 150)}, ${Math.round(40 - (t - 0.66) * 3 * 40)})`;
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const cellW = 10, cellH = 10;
      for (let y = 0; y < height; y += cellH) {
        for (let x = 0; x < width; x += cellW) {
          const dx = (x - width / 2) / width;
          const dy = (y - height / 2) / height;
          const base = 1.8 + 1.5 * Math.exp(-Math.pow(dx * 2.5, 2) - Math.pow(dy * 3, 2));
          const fluct = 0.3 * Math.sin(x / 30 + frame / 15) * Math.cos(y / 25 + frame / 20);
          const dip = (Math.abs(dx) < 0.12 && dy > -0.15 && dy < 0.2) ? 1.1 : 0;
          const v = Math.max(0.2, base + fluct - dip);
          ctx.fillStyle = color(v);
          ctx.fillRect(x, y, cellW - 1, cellH - 1);
          if (v < threshold) {
            ctx.strokeStyle = 'rgba(255, 77, 106, 0.5)';
            ctx.strokeRect(x, y, cellW - 1, cellH - 1);
          }
        }
      }

      ctx.strokeStyle = 'rgba(255, 77, 106, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(width * 0.38, height * 0.32, width * 0.18, height * 0.36);
      ctx.setLineDash([]);
      ctx.fillStyle = '#FF4D6A';
      ctx.font = '10px Inter';
      ctx.fillText('低应力区', width * 0.38, height * 0.3 - 3);

      animId = requestAnimationFrame(() => { frame++; render(); });
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [threshold, width, height, label]);

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-400 font-mono">阈值: {threshold} Pa</p>
      </div>
      <canvas ref={canvasRef} width={width} height={height} className="rounded-lg w-full" style={{ imageRendering: 'pixelated' }} />
      <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
        <span className="text-alert-red">● 低于阈值</span>
        <span className="text-medical-cyan">● 正常</span>
        <span className="text-alert-orange">● 偏高</span>
      </div>
    </div>
  );
}
