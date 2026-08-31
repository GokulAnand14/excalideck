import React, { useRef, useState } from 'react';
import { HardDrive, Terminal, Zap } from 'lucide-react';
import { sound } from '../utils/sound';


export const Spatial3DCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 8, ry: -12 });
  const [activeNode, setActiveNode] = useState<string>('rust');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Calculate 3D tilt angles
    const rx = -y * 22;
    const ry = x * 26;
    setTilt({ rx, ry });
  };

  const handleMouseLeave = () => {
    // Reset to gentle resting isometric angle
    setTilt({ rx: 6, ry: -10 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="spatial-3d-stage relative w-full max-w-4xl h-[440px] sm:h-[500px] flex items-center justify-center cursor-crosshair select-none my-6"
      style={{ perspective: 1200 }}
    >
      {/* Ambient Lighting Glow behind 3D Object */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-emerald-500/15 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* 3D Root Container */}
      <div
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s ease-out',
        }}
        className="relative w-full max-w-2xl h-[360px] sm:h-[400px] rounded-3xl border border-black/10 dark:border-white/15 bg-white/90 dark:bg-[#111215]/90 backdrop-blur-2xl mac-window-shadow flex flex-col justify-between p-6 overflow-hidden"
      >
        
        {/* Layer 1: Base Canvas Grid (translateZ: 0px) */}
        <div className="absolute inset-0 canvas-grid opacity-60 rounded-3xl pointer-events-none" />

        {/* 3D Titlebar Floating at Z: 20px */}
        <div
          style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}
          className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            <span className="ml-2 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
              excalideck-3d-architecture.canvas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              ⚡ WebGL 0ms
            </span>
          </div>
        </div>

        {/* Layer 2: 3D Isometric Nodes (translateZ: 50px) */}
        <div
          style={{ transform: 'translateZ(50px)', transformStyle: 'preserve-3d' }}
          className="my-auto grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {/* Node 1: Excalideck UI */}
          <div
            onClick={() => { sound.playPop(); setActiveNode('ui'); }}
            style={{ transform: activeNode === 'ui' ? 'translateZ(25px)' : 'translateZ(0px)', transition: 'transform 0.2s' }}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              activeNode === 'ui'
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/80 shadow-xl ring-2 ring-indigo-500/30'
                : 'border-black/5 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 hover:border-indigo-500/40'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
              UI
            </div>
            <div className="font-extrabold text-xs text-zinc-900 dark:text-white">Excalidraw Canvas</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">In-Memory Context</div>
          </div>

          {/* Node 2: Rust Engine */}
          <div
            onClick={() => { sound.playPop(); setActiveNode('rust'); }}
            style={{ transform: activeNode === 'rust' ? 'translateZ(25px)' : 'translateZ(0px)', transition: 'transform 0.2s' }}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              activeNode === 'rust'
                ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/80 shadow-xl ring-2 ring-emerald-500/30'
                : 'border-black/5 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 hover:border-emerald-500/40'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
              RS
            </div>
            <div className="font-extrabold text-xs text-zinc-900 dark:text-white">Rust Atomic I/O</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">0ms Scene Hydration</div>
          </div>

          {/* Node 3: Local Vault */}
          <div
            onClick={() => { sound.playPop(); setActiveNode('vault'); }}
            style={{ transform: activeNode === 'vault' ? 'translateZ(25px)' : 'translateZ(0px)', transition: 'transform 0.2s' }}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              activeNode === 'vault'
                ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/80 shadow-xl ring-2 ring-amber-500/30'
                : 'border-black/5 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 hover:border-amber-500/40'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="font-extrabold text-xs text-zinc-900 dark:text-white">Obsidian Vault</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">Zero Cloud Lock-in</div>
          </div>
        </div>

        {/* Layer 3: Floating High-Elevation Glass Chips (translateZ: 80px) */}
        <div
          style={{ transform: 'translateZ(80px)', transformStyle: 'preserve-3d' }}
          className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/5 dark:border-white/10 text-xs font-mono"
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 dark:bg-zinc-800/90 shadow-md border border-black/5 dark:border-white/10 text-zinc-700 dark:text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Decoupled <strong className="text-indigo-500">.assets/</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 dark:bg-zinc-800/90 shadow-md border border-black/5 dark:border-white/10 text-zinc-700 dark:text-zinc-300">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>GhostKeys Vim Mode</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 dark:bg-zinc-800/90 shadow-md border border-black/5 dark:border-white/10 text-zinc-700 dark:text-zinc-300">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>32MB RAM</span>
          </div>
        </div>

      </div>

      {/* Subtle 3D Depth Hint underneath */}
      <div className="absolute -bottom-2 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
        Hover mouse to tilt 3D canvas in spatial depth
      </div>

    </div>
  );
};
