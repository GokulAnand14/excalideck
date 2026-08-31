import React, { useState, useEffect } from 'react';
import { Terminal, CheckCircle2, Play } from 'lucide-react';
import { sound } from '../utils/sound';

export const VimPlayground: React.FC = () => {
  const [mode, setMode] = useState<'NORMAL' | 'VISUAL' | 'INSERT'>('NORMAL');
  const [lastAction, setLastAction] = useState<string>('Ready for input. Press "r", "e", "d", or "i"');
  const [spawns, setSpawns] = useState<{ id: string; key: string; label: string; time: string }[]>([
    { id: '1', key: 'r', label: 'Spawned Rectangle (x: 120, y: 80)', time: '0ms' },
    { id: '2', key: 'e', label: 'Spawned Ellipse (x: 280, y: 80)', time: '0ms' },
  ]);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleKey = (key: string) => {
    sound.playVimKey();
    const k = key.toLowerCase();

    if (k === 'escape') {
      setMode('NORMAL');
      setLastAction('Switched to [NORMAL] mode');
    } else if (k === 'i') {
      setMode('INSERT');
      setLastAction('Switched to [INSERT] mode :  Type anywhere on canvas');
    } else if (k === 'v') {
      setMode('VISUAL');
      setLastAction('Switched to [VISUAL] mode :  Multi-select shapes');
    } else if (k === 'r') {
      setSpawns((prev) => [{ id: Date.now().toString(), key: 'r', label: 'Spawned Rectangle 400x200', time: '0ms' }, ...prev.slice(0, 4)]);
      setLastAction('GhostKeys: Spawned Rectangle at cursor');
    } else if (k === 'e') {
      setSpawns((prev) => [{ id: Date.now().toString(), key: 'e', label: 'Spawned Ellipse Ø180', time: '0ms' }, ...prev.slice(0, 4)]);
      setLastAction('GhostKeys: Spawned Ellipse at cursor');
    } else if (k === 'd') {
      setSpawns((prev) => [{ id: Date.now().toString(), key: 'd', label: 'Spawned Diamond Decision', time: '0ms' }, ...prev.slice(0, 4)]);
      setLastAction('GhostKeys: Spawned Diamond');
    } else if (k === 'a') {
      setSpawns((prev) => [{ id: Date.now().toString(), key: 'a', label: 'Connected Arrow', time: '0ms' }, ...prev.slice(0, 4)]);
      setLastAction('GhostKeys: Connected Arrow');
    } else if (k === 'w' || key === ':w') {
      sound.playSuccess();
      triggerToast('💾 Saved atomically to local disk in 0.3ms (Rust engine)');
      setLastAction(':w :  Atomic write to filesystem successful');
    } else if (['h', 'j', 'k', 'l'].includes(k)) {
      setLastAction(`GhostKeys: Canvas pan ${k.toUpperCase()} (delta: 24px)`);
    } else {
      setLastAction(`Pressed key: "${key}"`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      const key = e.key;
      if (['r', 'e', 'd', 'a', 'i', 'v', 'h', 'j', 'k', 'l', 'Escape'].includes(key)) {
        e.preventDefault();
        handleKey(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  return (
    <div className="flex flex-col w-full bg-zinc-950 text-zinc-100 font-mono text-xs overflow-hidden select-none">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-zinc-200">GhostKeys Vim Engine</span>
          <span className="text-[10px] text-zinc-500">v1.2 (Rust IPC)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider ${
              mode === 'NORMAL'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : mode === 'VISUAL'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            : {mode} --
          </span>
        </div>
      </div>

      <div className="p-4 bg-zinc-900/40 border-b border-zinc-800/80">
        <div className="text-[11px] text-zinc-400 mb-2 flex items-center justify-between">
          <span>Click keycaps or press on physical keyboard:</span>
          <span className="text-indigo-400 font-medium">⚡ 0ms Modal Dispatch</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'r', desc: 'Rectangle' },
            { key: 'e', desc: 'Ellipse' },
            { key: 'd', desc: 'Diamond' },
            { key: 'a', desc: 'Arrow' },
            { key: 'h', desc: 'Left' },
            { key: 'j', desc: 'Down' },
            { key: 'k', desc: 'Up' },
            { key: 'l', desc: 'Right' },
            { key: 'i', desc: 'Insert' },
            { key: 'v', desc: 'Visual' },
            { key: 'Escape', desc: 'Normal' },
            { key: ':w', desc: 'Save' },
          ].map((k) => (
            <button
              key={k.key}
              onClick={() => handleKey(k.key)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 border border-zinc-700/80 shadow-sm transition-all flex items-center gap-1.5"
            >
              <span className="font-bold text-indigo-400">{k.key}</span>
              <span className="text-[10px] text-zinc-400">{k.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 min-h-[160px] flex flex-col justify-between">
        <div>
          <div className="text-[11px] text-zinc-500 mb-2 flex items-center gap-1.5">
            <Play className="w-3 h-3 text-emerald-400" />
            <span>Active GhostKeys Stream:</span>
          </div>

          <div className="space-y-1.5">
            {spawns.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-1.5 rounded bg-zinc-900/60 border border-zinc-800/60 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span className="text-zinc-300">{s.label}</span>
                </div>
                <span className="text-emerald-400 font-mono">{s.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400">&gt;</span>
            <span className="text-zinc-200 font-semibold">{lastAction}</span>
          </div>
          <span className="text-zinc-600">utf-8 [excalidraw-vault]</span>
        </div>
      </div>

      {toast && (
        <div className="absolute top-14 right-4 px-3 py-2 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-semibold shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};
