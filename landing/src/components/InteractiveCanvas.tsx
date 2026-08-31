import React, { useRef, useState, useEffect } from 'react';
import { Square, Circle, Diamond, ArrowUpRight, PenTool, Trash2 } from 'lucide-react';
import { sound } from '../utils/sound';

type Tool = 'select' | 'rectangle' | 'ellipse' | 'diamond' | 'arrow' | 'pen';

interface Shape {
  id: string;
  type: Tool;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  fill: string;
  points?: { x: number; y: number }[];
  text?: string;
}

export const InteractiveCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#4f46e5');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [activePreset, setActivePreset] = useState<string>('architecture');

  const presetArchitectures = {
    architecture: [
      { id: '1', type: 'rectangle' as Tool, x: 40, y: 40, w: 160, h: 65, color: '#4f46e5', fill: '#eef2ff', text: 'Excalideck (Tauri v2)' },
      { id: '2', type: 'rectangle' as Tool, x: 260, y: 40, w: 150, h: 65, color: '#059669', fill: '#ecfdf5', text: 'Rust Atomic I/O' },
      { id: '3', type: 'diamond' as Tool, x: 470, y: 35, w: 140, h: 75, color: '#d97706', fill: '#fffbeb', text: '0ms Switch' },
      { id: '4', type: 'arrow' as Tool, x: 200, y: 72, w: 60, h: 0, color: '#4f46e5', fill: 'none' },
      { id: '5', type: 'arrow' as Tool, x: 410, y: 72, w: 60, h: 0, color: '#059669', fill: 'none' },
      { id: '6', type: 'rectangle' as Tool, x: 210, y: 155, w: 260, h: 60, color: '#7c3aed', fill: '#f5f3ff', text: '📁 Local Vault (.assets decoupled)' },
      { id: '7', type: 'arrow' as Tool, x: 540, y: 110, w: -100, h: 45, color: '#d97706', fill: 'none' },
    ],
    ghostkeys: [
      { id: 'g1', type: 'rectangle' as Tool, x: 70, y: 50, w: 180, h: 70, color: '#4f46e5', fill: '#eef2ff', text: '[NORMAL] Mode' },
      { id: 'g2', type: 'diamond' as Tool, x: 320, y: 40, w: 140, h: 90, color: '#7c3aed', fill: '#f5f3ff', text: 'Press "r"' },
      { id: 'g3', type: 'ellipse' as Tool, x: 520, y: 50, w: 160, h: 70, color: '#059669', fill: '#ecfdf5', text: 'Instant Rectangle' },
      { id: 'g4', type: 'arrow' as Tool, x: 250, y: 85, w: 70, h: 0, color: '#4f46e5', fill: 'none' },
      { id: 'g5', type: 'arrow' as Tool, x: 460, y: 85, w: 60, h: 0, color: '#7c3aed', fill: 'none' },
    ],
  };

  useEffect(() => {
    setShapes(presetArchitectures.architecture);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const drawRoughRect = (x: number, y: number, w: number, h: number, stroke: string, fill: string, text?: string) => {
      ctx.save();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      if (fill !== 'none') ctx.fill();
      ctx.stroke();

      if (text) {
        ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#f4f4f5' : '#18181b';
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2);
      }
      ctx.restore();
    };

    const drawRoughEllipse = (x: number, y: number, w: number, h: number, stroke: string, fill: string, text?: string) => {
      ctx.save();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
      if (fill !== 'none') ctx.fill();
      ctx.stroke();

      if (text) {
        ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#f4f4f5' : '#18181b';
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2);
      }
      ctx.restore();
    };

    const drawRoughDiamond = (x: number, y: number, w: number, h: number, stroke: string, fill: string, text?: string) => {
      ctx.save();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w / 2, y + h);
      ctx.lineTo(x, y + h / 2);
      ctx.closePath();
      if (fill !== 'none') ctx.fill();
      ctx.stroke();

      if (text) {
        ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#f4f4f5' : '#18181b';
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2);
      }
      ctx.restore();
    };

    const drawArrow = (x1: number, y1: number, dx: number, dy: number, stroke: string) => {
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.fillStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      const x2 = x1 + dx;
      const y2 = y1 + dy;
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const angle = Math.atan2(dy, dx);
      const headlen = 10;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    shapes.forEach((s) => {
      if (s.type === 'rectangle') drawRoughRect(s.x, s.y, s.w, s.h, s.color, s.fill, s.text);
      if (s.type === 'ellipse') drawRoughEllipse(s.x, s.y, s.w, s.h, s.color, s.fill, s.text);
      if (s.type === 'diamond') drawRoughDiamond(s.x, s.y, s.w, s.h, s.color, s.fill, s.text);
      if (s.type === 'arrow') drawArrow(s.x, s.y, s.w, s.h, s.color);
      if (s.type === 'pen' && s.points && s.points.length > 1) {
        ctx.save();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }
    });

    if (isDrawing && activeTool === 'pen' && currentPoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [shapes, isDrawing, currentPoints, activeTool, color]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    sound.playClick(600, 0.02);
    setIsDrawing(true);

    if (activeTool === 'pen') {
      setCurrentPoints([{ x, y }]);
    } else if (activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'diamond') {
      const newShape: Shape = {
        id: Date.now().toString(),
        type: activeTool,
        x: Math.max(10, x - 50),
        y: Math.max(10, y - 30),
        w: 130,
        h: 60,
        color: color,
        fill: color === '#4f46e5' ? '#eef2ff' : '#f4f4f5',
        text: 'Visual Node',
      };
      setShapes((prev) => [...prev, newShape]);
      sound.playPop();
    } else if (activeTool === 'arrow') {
      const newShape: Shape = {
        id: Date.now().toString(),
        type: 'arrow',
        x: x,
        y: y,
        w: 90,
        h: 0,
        color: color,
        fill: 'none',
      };
      setShapes((prev) => [...prev, newShape]);
      sound.playPop();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'pen') {
      setCurrentPoints((prev) => [...prev, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    if (activeTool === 'pen' && currentPoints.length > 1) {
      setShapes((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'pen',
          x: 0,
          y: 0,
          w: 0,
          h: 0,
          color: color,
          fill: 'none',
          points: currentPoints,
        },
      ]);
    }
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const clearCanvas = () => {
    sound.playClick(300, 0.05);
    setShapes([]);
  };

  const loadPreset = (preset: 'architecture' | 'ghostkeys') => {
    sound.playSuccess();
    setActivePreset(preset);
    setShapes(presetArchitectures[preset]);
  };

  return (
    <div className="flex flex-col w-full bg-white dark:bg-zinc-950 select-none">
      <div className="h-12 px-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-2 bg-zinc-50/80 dark:bg-zinc-900/60 overflow-x-auto">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/80">
          <button
            onClick={() => { sound.playClick(); setActiveTool('pen'); }}
            className={`p-1.5 rounded-lg transition-all ${
              activeTool === 'pen' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
            title="Freehand Sketching"
          >
            <PenTool className="w-4 h-4" />
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTool('rectangle'); }}
            className={`p-1.5 rounded-lg transition-all ${
              activeTool === 'rectangle' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
            title="Spawn Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTool('ellipse'); }}
            className={`p-1.5 rounded-lg transition-all ${
              activeTool === 'ellipse' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
            title="Spawn Ellipse"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTool('diamond'); }}
            className={`p-1.5 rounded-lg transition-all ${
              activeTool === 'diamond' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
            title="Spawn Diamond"
          >
            <Diamond className="w-4 h-4" />
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTool('arrow'); }}
            className={`p-1.5 rounded-lg transition-all ${
              activeTool === 'arrow' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
            title="Spawn Arrow"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {['#4f46e5', '#059669', '#d97706', '#dc2626', '#18181b'].map((c) => (
            <button
              key={c}
              onClick={() => { sound.playClick(800); setColor(c); }}
              style={{ backgroundColor: c }}
              className={`w-4 h-4 rounded-full transition-transform ${
                color === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900' : 'hover:scale-110'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => loadPreset('architecture')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activePreset === 'architecture' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Architecture
          </button>
          <button
            onClick={() => loadPreset('ghostkeys')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activePreset === 'ghostkeys' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Vim Flow
          </button>
          <button
            onClick={clearCanvas}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative w-full h-[320px] sm:h-[380px] overflow-hidden bg-[#faf9f6] dark:bg-[#0c0d0e] cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={760}
          height={380}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full block"
        />
        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border border-black/5 dark:border-white/10 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 pointer-events-none flex items-center gap-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Click anywhere to draw or spawn shapes · 0ms latency</span>
        </div>
      </div>
    </div>
  );
};
