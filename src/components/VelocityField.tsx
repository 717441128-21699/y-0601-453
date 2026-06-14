import { useEffect, useRef } from 'react';

interface Props {
  threshold?: number;
  width?: number;
  height?: number;
}

export default function VelocityField({ threshold = 1.5, width = 700, height = 380 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let frame = 0;
    let animId: number;

    const W = width, H = height;

    const colorMap = (v: number) => {
      const t = Math.max(0, Math.min(1, v));
      if (t < 0.25) {
        const k = t / 0.25;
        return `rgb(${Math.round(30 + k * 20)}, ${Math.round(60 + k * 80)}, ${Math.round(150 + k * 80)})`;
      } else if (t < 0.5) {
        const k = (t - 0.25) / 0.25;
        return `rgb(${Math.round(50 + k * 50)}, ${Math.round(140 + k * 80)}, ${Math.round(230 - k * 60)})`;
      } else if (t < 0.75) {
        const k = (t - 0.5) / 0.25;
        return `rgb(${Math.round(100 + k * 150)}, ${Math.round(220 - k * 40)}, ${Math.round(170 - k * 80)})`;
      } else {
        const k = (t - 0.75) / 0.25;
        return `rgb(${Math.round(250 - k * 30)}, ${Math.round(180 - k * 100)}, ${Math.round(90 - k * 50)})`;
      }
    };

    const drawVessel = () => {
      ctx.beginPath();
      ctx.moveTo(40, H / 2);
      ctx.bezierCurveTo(150, H / 2 - 60, 280, H / 2 + 40, 400, H / 2 - 10);
      ctx.bezierCurveTo(520, H / 2 - 50, 600, H / 2 + 20, W - 40, H / 2 + 5);
      ctx.lineTo(W - 40, H / 2 + 35);
      ctx.bezierCurveTo(600, H / 2 + 55, 520, H / 2 - 15, 400, H / 2 + 25);
      ctx.bezierCurveTo(280, H / 2 + 75, 150, H / 2 - 25, 40, H / 2 + 30);
      ctx.closePath();
      ctx.save();
      ctx.clip();

      for (let y = 0; y < H; y += 3) {
        for (let x = 0; x < W; x += 3) {
          const cx = x + 1.5, cy = y + 1.5;
          const dx = (cx - W / 2) / W;
          const dy = (cy - H / 2) / H;
          const pulsate = 0.6 + 0.4 * Math.sin((x / 50) + (frame / 20));
          const speed = (0.3 + 0.7 * Math.exp(-Math.pow(dy * 4, 2) - Math.pow(dx * 1.5, 2))) * pulsate;
          ctx.fillStyle = colorMap(speed);
          ctx.fillRect(x, y, 3, 3);
        }
      }

      const stentX = W * 0.48;
      const stentY = H / 2;
      const grad = ctx.createLinearGradient(stentX - 40, stentY, stentX + 40, stentY);
      grad.addColorStop(0, 'rgba(255, 215, 0, 0.35)');
      grad.addColorStop(0.5, 'rgba(255, 215, 0, 0.55)');
      grad.addColorStop(1, 'rgba(255, 215, 0, 0.35)');
      ctx.fillStyle = grad;
      ctx.fillRect(stentX - 45, stentY - 22, 90, 44);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        const baseX = stentX - 40 + i * 4.2;
        const t = (frame / 30 + i / 10) % 1;
        const y = stentY - 18 + t * 36;
        ctx.beginPath();
        ctx.moveTo(baseX, y);
        ctx.lineTo(baseX + 12, y + 4);
        ctx.stroke();
      }

      ctx.restore();

      ctx.strokeStyle = 'rgba(0, 212, 170, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(40, H / 2);
      ctx.bezierCurveTo(150, H / 2 - 60, 280, H / 2 + 40, 400, H / 2 - 10);
      ctx.bezierCurveTo(520, H / 2 - 50, 600, H / 2 + 20, W - 40, H / 2 + 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(40, H / 2 + 30);
      ctx.bezierCurveTo(150, H / 2 - 25, 280, H / 2 + 75, 400, H / 2 + 25);
      ctx.bezierCurveTo(520, H / 2 - 15, 600, H / 2 + 55, W - 40, H / 2 + 35);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 180, 71, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(stentX - 45, stentY - 22, 90, 44);
      ctx.setLineDash([]);
      ctx.fillStyle = '#FFB547';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText('支架植入区', stentX - 28, stentY - 28);

      const lowY = 30 + (threshold / 4) * 30;
      ctx.strokeStyle = 'rgba(255, 77, 106, 0.6)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, H - lowY);
      ctx.lineTo(W - 40, H - lowY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#FF4D6A';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`阈值 ${threshold} Pa`, W - 120, H - lowY - 5);
    };

    const drawLegend = () => {
      const lx = W - 140, ly = 15, lw = 120, lh = 14;
      const grad = ctx.createLinearGradient(lx, 0, lx + lw, 0);
      grad.addColorStop(0, colorMap(0));
      grad.addColorStop(0.25, colorMap(0.25));
      grad.addColorStop(0.5, colorMap(0.5));
      grad.addColorStop(0.75, colorMap(0.75));
      grad.addColorStop(1, colorMap(1));
      ctx.fillStyle = grad;
      ctx.fillRect(lx, ly, lw, lh);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.strokeRect(lx, ly, lw, lh);
      ctx.fillStyle = '#888';
      ctx.font = '10px Inter';
      ctx.fillText('低', lx - 15, ly + 11);
      ctx.fillText('速度 高', lx + lw + 4, ly + 11);
    };

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(11, 25, 41, 0.5)';
      ctx.fillRect(0, 0, W, H);
      drawVessel();
      drawLegend();
      frame++;
      animId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animId);
  }, [threshold, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="rounded-xl" />;
}
