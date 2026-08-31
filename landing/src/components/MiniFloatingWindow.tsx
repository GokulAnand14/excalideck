import React, { useState, useRef, useEffect } from 'react';
import { sound } from '../utils/sound';

interface MiniFloatingWindowProps {
  id: string;
  filename: string;
  className?: string;
  initialX?: number;
  initialY?: number;
  children: React.ReactNode;
}

export const MiniFloatingWindow: React.FC<MiniFloatingWindowProps> = ({
  id,
  filename,
  className = '',
  initialX = 0,
  initialY = 0,
  children,
}) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a, .no-drag')) return;
    sound.playClick(800, 0.02);
    setIsDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      setPos({
        x: dragStart.current.startX + dx,
        y: dragStart.current.startY + dy,
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        sound.playSnap();
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      data-id={id}
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`flex flex-col items-center select-none ${className}`}
    >
      {/* macOS Window */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-full rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#121316]/95 backdrop-blur-xl mac-window-shadow cursor-grab active:cursor-grabbing transition-shadow ${
          isDragging ? 'shadow-2xl ring-2 ring-indigo-500/30 opacity-95 scale-[1.02]' : ''
        }`}
      >
        {/* Titlebar with Traffic Lights */}
        <div className="h-7 px-2.5 flex items-center justify-between border-b border-black/5 dark:border-white/10 bg-zinc-100/90 dark:bg-[#18191d]/90">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <div className="w-3 h-3 text-zinc-400" />
        </div>

        {/* Content */}
        <div className="relative overflow-hidden">
          {children}
        </div>
      </div>

      {/* Filename underneath like in heyclicky */}
      <span className="mt-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 select-none">
        {filename}
      </span>
    </div>
  );
};
