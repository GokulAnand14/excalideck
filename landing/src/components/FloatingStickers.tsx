import React, { useState } from 'react';
import { sound } from '../utils/sound';
import { Folder, HardDrive, Trash2, Sparkles } from 'lucide-react';

interface StickerItem {
  id: string;
  label: string;
  sublabel?: string;
  type: 'badge' | 'tag' | 'folder' | 'disk' | 'trash';
  initialX: number;
  initialY: number;
  rotate: string;
}

export const FloatingStickers: React.FC = () => {
  const [stickers] = useState<StickerItem[]>([
    { id: '1', label: 'HELLO', sublabel: 'my name is Excalideck', type: 'badge', initialX: 30, initialY: 70, rotate: '-rotate-6' },
    { id: '2', label: 'vaults/architecture', type: 'folder', initialX: 120, initialY: 340, rotate: 'rotate-3' },
    { id: '3', label: 'local-first', type: 'disk', initialX: 980, initialY: 100, rotate: '-rotate-3' },
    { id: '4', label: '0ms scene switch', type: 'tag', initialX: 1020, initialY: 320, rotate: 'rotate-6' },
    { id: '5', label: 'git-friendly diffs', type: 'tag', initialX: 50, initialY: 520, rotate: '-rotate-3' },
    { id: '6', label: '.trash', type: 'trash', initialX: 70, initialY: 660, rotate: 'rotate-2' },
  ]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {stickers.map((s) => (
        <div
          key={s.id}
          style={{
            left: `${s.initialX}px`,
            top: `${s.initialY}px`,
          }}
          onMouseDown={() => sound.playPop()}
          className={`absolute hidden lg:block pointer-events-auto sticker ${s.rotate} transition-transform hover:scale-110 shadow-lg`}
        >
          {s.type === 'badge' && (
            <div className="w-32 rounded-lg border-2 border-red-500 bg-white dark:bg-zinc-900 overflow-hidden text-center shadow-md">
              <div className="bg-red-500 text-white text-[9px] font-black tracking-widest py-0.5 uppercase">
                {s.label}
              </div>
              <div className="p-1.5 text-[9px] font-mono font-bold text-zinc-800 dark:text-zinc-200">
                {s.sublabel}
              </div>
            </div>
          )}

          {s.type === 'folder' && (
            <div className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-mono font-semibold shadow-md flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5" />
              <span>{s.label}</span>
            </div>
          )}

          {s.type === 'disk' && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-mono font-semibold shadow-md flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              <span>{s.label}</span>
            </div>
          )}

          {s.type === 'tag' && (
            <div className="px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-zinc-100 text-xs font-mono font-semibold shadow-md border border-white/10 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{s.label}</span>
            </div>
          )}

          {s.type === 'trash' && (
            <div className="p-2.5 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80 backdrop-blur-md border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 shadow-md flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono">{s.label}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
