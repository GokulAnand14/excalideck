import React, { useEffect, useRef } from 'react';
import { sound } from '../utils/sound';

export const CanvasScribbler: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const points = useRef<Array<{ x: number; y: number; age: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseDown = (e: MouseEvent) => {
      // Don't draw if clicking on interactive UI elements
      if ((e.target as HTMLElement).closest('button, a, input, .hero-letter, .sketch-doodle')) return;
      isDrawing.current = true;
      points.current.push({ x: e.clientX, y: e.clientY, age: 0 });
      sound.playClick(1100, 0.015);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDrawing.current) return;
      points.current.push({ x: e.clientX, y: e.clientY, age: 0 });
    };

    const onMouseUp = () => {
      isDrawing.current = false;
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop: Render & Dissolve strokes
    let rafId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (points.current.length > 1) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < points.current.length; i++) {
          const p1 = points.current[i - 1];
          const p2 = points.current[i];
          const alpha = Math.max(0, 1 - p1.age / 120);

          if (alpha > 0) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha * 0.45})`;
            ctx.lineWidth = 3;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
          p1.age += 1;
        }

        // Clean dead points
        points.current = points.current.filter((p) => p.age < 120);
      }

      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-10 select-none opacity-90"
    />
  );
};
