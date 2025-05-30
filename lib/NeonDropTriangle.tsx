import React, { useRef, useEffect } from 'react';

/**
 * NeonDropTriangle: Animated canvas drop with pulsing, color-shifting neon triangle and a drip.
 * Props:
 *   size: number (px) - width/height of the canvas (default: 150)
 */
export default function NeonDropTriangle({ size = 150 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const dripStartRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let running = true;
    let start = performance.now();

    function drawFrame(now: number) {
      const elapsed = (now - start) / 1000.0;
      // Animate hue (0-360)
      const hue = (elapsed * 60) % 360;
      // Pulse triangle glow
      const pulse = 8 + 8 * Math.abs(Math.sin(elapsed * 2));
      // Drip animation
      const dripCycle = 2.0; // seconds per drip
      const dripElapsed = (elapsed % dripCycle);
      const dripY = dripElapsed < 1.2 ? dripElapsed / 1.2 : null; // 0 to 1, then disappear

      // --- Clear ---
      canvas.width = size;
      canvas.height = size;
      ctx.clearRect(0, 0, size, size);

      // --- Draw water drop shape ---
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(size/2, size*0.13);
      ctx.bezierCurveTo(size*0.05, size*0.38, size*0.12, size*0.75, size/2, size*0.95);
      ctx.bezierCurveTo(size*0.88, size*0.75, size*0.95, size*0.38, size/2, size*0.13);
      ctx.closePath();
      ctx.shadowColor = `hsla(${hue}, 100%, 80%, 0.65)`;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = `hsla(${hue}, 100%, 80%, 0.85)`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // --- Drip (falling droplet from tip) ---
      if (dripY !== null) {
        ctx.save();
        const dripX = size/2;
        const dripStartY = size*0.13;
        const dripEndY = size*0.13 + size*0.18 + size*0.30*dripY;
        ctx.beginPath();
        ctx.arc(dripX, dripStartY + (dripEndY - dripStartY) * dripY, size*0.04, 0, 2*Math.PI);
        ctx.fillStyle = `hsla(${hue+30}, 100%, 65%, 0.88)`;
        ctx.shadowColor = `hsla(${hue+30}, 100%, 60%, 0.45)`;
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();
      }

      // --- Clip to drop for triangle ---
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(size/2, size*0.13);
      ctx.bezierCurveTo(size*0.05, size*0.38, size*0.12, size*0.75, size/2, size*0.95);
      ctx.bezierCurveTo(size*0.88, size*0.75, size*0.95, size*0.38, size/2, size*0.13);
      ctx.closePath();
      ctx.clip();

      // --- Draw neon triangle inside drop ---
      const cx = size/2, cy = size*0.60;
      const triSize = size*0.32;
      // Outer triangle
      ctx.beginPath();
      ctx.moveTo(cx, cy-triSize);
      ctx.lineTo(cx-triSize*0.866, cy+triSize/2);
      ctx.lineTo(cx+triSize*0.866, cy+triSize/2);
      ctx.closePath();
      const grad = ctx.createLinearGradient(cx-triSize, cy-triSize, cx+triSize, cy+triSize);
      grad.addColorStop(0, `hsla(${hue}, 100%, 80%, 0.9)`);
      grad.addColorStop(0.5, `hsla(${(hue+60)%360}, 100%, 80%, 0.7)`);
      grad.addColorStop(1, `hsla(${(hue+120)%360}, 100%, 80%, 0.9)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.1;
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.7)`;
      ctx.shadowBlur = pulse;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner triangle lines
      ctx.beginPath();
      ctx.moveTo(cx-triSize*0.866, cy+triSize/2);
      ctx.lineTo(cx+triSize*0.866, cy+triSize/2);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      const midY = (cy-triSize + cy+triSize/2)/2;
      ctx.beginPath();
      ctx.moveTo(cx, midY);
      ctx.lineTo(cx+triSize*0.866, cy+triSize/2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, midY);
      ctx.lineTo(cx-triSize*0.866, cy+triSize/2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy-triSize);
      ctx.lineTo(cx, midY);
      ctx.stroke();

      ctx.restore();

      if (running) animationRef.current = requestAnimationFrame(drawFrame);
    }
    animationRef.current = requestAnimationFrame(drawFrame);
    return () => {
      running = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [size]);

  return (
    <div style={{ width: size, height: size, margin: '0 auto' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
