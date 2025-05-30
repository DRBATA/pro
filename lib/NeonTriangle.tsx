import React, { useRef, useEffect } from 'react';

export default function NeonTriangle({ size = 150 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = size;
    canvas.height = size;
    let opacity = 0.8;
    const hueRef = { current: 180 };
    let animationId: number;

    function animate() {
      hueRef.current = (hueRef.current + 0.1) % 360;
      drawTriangle(hueRef.current);
      animationId = requestAnimationFrame(animate);
    }

    animate();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };

    const drawInnerTriangles = (centerX: number, centerY: number, size: number, gradient: CanvasGradient) => {
      const topY = centerY - size;
      const leftX = centerX - size * 0.866;
      const rightX = centerX + size * 0.866;
      const bottomY = centerY + size / 2;
      ctx.beginPath();
      ctx.moveTo(leftX, bottomY);
      ctx.lineTo(rightX, bottomY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const midY = (topY + bottomY) / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, midY);
      ctx.lineTo(rightX, bottomY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX, midY);
      ctx.lineTo(leftX, bottomY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX, topY);
      ctx.lineTo(centerX, midY);
      ctx.stroke();
    };

    const drawTriangle = (hue: number) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const size = 60;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size);
      ctx.lineTo(centerX - size * 0.866, centerY + size / 2);
      ctx.lineTo(centerX + size * 0.866, centerY + size / 2);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(centerX - size, centerY - size, centerX + size, centerY + size);
      gradient.addColorStop(0, `hsla(${hue}, 100%, 80%, ${opacity})`);
      gradient.addColorStop(0.5, `hsla(${(hue + 60)%360}, 100%, 80%, ${opacity})`);
      gradient.addColorStop(1, `hsla(${(hue + 120)%360}, 100%, 80%, ${opacity})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.5)`;
      ctx.shadowBlur = 8;
      ctx.stroke();
      drawInnerTriangles(centerX, centerY, size, gradient);
    };
  }, []);

  return (
    <div style={{ width: size, height: size, margin: '0 auto' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
