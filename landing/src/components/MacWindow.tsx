import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { sound } from '../utils/sound';

interface MacWindowProps {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  className?: string;
  initialX?: number;
  initialY?: number;
  isDraggable?: boolean;
}

export const MacWindow: React.FC<MacWindowProps> = ({
  id,
  title,
  subtitle,
  badge,
  badgeColor = 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300',
  children,
  className = '',
  initialX = 0,
  initialY = 0,
  isDraggable = true,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable || isMaximized) return;
    if ((e.target as HTMLElement).closest('button, input, a, .no-drag')) return;
    
    sound.playClick(900, 0.02);
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
      data-window-id={id}
      style={{
        transform: isMaximized ? 'none' : `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s',
      }}
      className={`mac-window-shadow rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#121316]/95 backdrop-blur-2xl transition-all ${
        isMaximized ? 'fixed inset-4 z-50' : ''
      } ${isDragging ? 'shadow-2xl opacity-95 scale-[1.008] ring-2 ring-indigo-500/20' : ''} ${className}`}
    >
      {/* Titlebar */}
      <div
        onMouseDown={handleMouseDown}
        className="h-10 px-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/10 bg-zinc-100/90 dark:bg-[#17181c]/90 select-none cursor-grab active:cursor-grabbing"
      >
        {/* Left: Traffic Lights */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { sound.playClick(350); setPos({ x: 0, y: 0 }); }}
            aria-label="Reset Position"
            title="Reset position"
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-90 flex items-center justify-center group cursor-pointer shadow-xs"
          >
            <X className="w-2 h-2 text-black/50 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={() => { sound.playClick(500); setIsMinimized(!isMinimized); }}
            aria-label="Minimize"
            title="Minimize"
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-90 flex items-center justify-center group cursor-pointer shadow-xs"
          >
            <Minimize2 className="w-2 h-2 text-black/50 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={() => { sound.playClick(750); setIsMaximized(!isMaximized); }}
            aria-label="Maximize"
            title="Toggle full screen"
            className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-90 flex items-center justify-center group cursor-pointer shadow-xs"
          >
            <Maximize2 className="w-2 h-2 text-black/50 opacity-0 group-hover:opacity-100" />
          </button>

          {badge && (
            <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>

        {/* Center: Title */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[200px] sm:max-w-none">
          <span>{title}</span>
          {subtitle && (
            <span className="hidden sm:inline text-zinc-400 font-normal">
              · {subtitle}
            </span>
          )}
        </div>

        {/* Right decoration */}
        <div className="w-12 flex justify-end">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
        </div>
      </div>

      {/* Content Area */}
      {!isMinimized && (
        <div className="relative">
          {children}
        </div>
      )}
    </div>
  );
};
