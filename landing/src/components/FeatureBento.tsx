import React, { useState } from 'react';
import { 
  HardDrive, 
  Zap, 
  FolderGit2, 
  Terminal, 
  Puzzle, 
  ShieldCheck, 
  Sparkles, 
  Folder,
  Check
} from 'lucide-react';
import { animate } from 'animejs';

interface FeatureTab {
  id: string;
  icon: React.ReactNode;
  label: string;
  badge: string;
  title: string;
  tagline: string;
  bullets: string[];
  techSpec: string;
}

export const FeatureBento: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('vaults');
  const [selectedFolderFile, setSelectedFolderFile] = useState<string>('Architecture.excalidraw');
  const [ghostKey, setGhostKey] = useState<string>('r');
  const [activePlugin, setActivePlugin] = useState<'ghost' | 'habit' | 'calendar'>('habit');

  const words = ["Built", "for", "Speed.", "Engineered", "for", "Local", "Vaults."];

  const features: FeatureTab[] = [
    {
      id: 'vaults',
      icon: <HardDrive className="w-4 h-4" />,
      label: 'Obsidian Vaults',
      badge: 'Local Filesystem',
      title: 'Obsidian-Style Hierarchical Vaults',
      tagline: 'Point Excalideck at any local directory on disk. Organize drawings in nested folders with zero cloud lock-in.',
      bullets: [
        'Native directory picker for any local folder or synced drive (iCloud, Dropbox, Syncthing)',
        'Recursive folder tree with drag-and-drop file organization and rename commands',
        'Direct support for both .excalidraw drawing files and .excalidrawlib libraries',
        '100% offline, privacy-first storage with zero accounts or telemetry',
      ],
      techSpec: 'Rust tauri_plugin_fs · Multi-vault switcher',
    },
    {
      id: 'speed',
      icon: <Zap className="w-4 h-4" />,
      label: '0ms Canvas Hydration',
      badge: 'In-Memory WebGL',
      title: 'Instant 0ms File Switching',
      tagline: 'Unlike browser tabs or plugins that destroy and recreate the canvas DOM on every click, Excalideck keeps the canvas alive in memory.',
      bullets: [
        'Zero-flicker scene hydration: hopping between 50 different drawings takes 0ms',
        '2000ms debounced atomic auto-save in background plus instant Cmd+S / :w flush',
        'Native file system watcher detects external disk edits and hot-reloads instantly',
        '32MB idle RAM footprint vs 380MB+ on Electron alternatives',
      ],
      techSpec: 'Persistent WebGL context · Debounced Rust atomic I/O',
    },
    {
      id: 'assets',
      icon: <FolderGit2 className="w-4 h-4" />,
      label: 'Decoupled .assets/',
      badge: 'Clean Git Diffs',
      title: 'Isolated Assets for Clean Version Control',
      tagline: 'Embedded base64 images are automatically extracted to a dedicated .assets/ folder, keeping your Git commits human-readable.',
      bullets: [
        'Automatic extraction of pasted PNG, JPG, and SVG images into .assets/ directory',
        'Saves clean, concise JSON diffs without 50MB base64 blob pollution',
        'Zero merge conflicts when collaborating via Git, GitHub, or Syncthing',
        'Self-contained vault portability: copy or clone your folder anywhere',
      ],
      techSpec: 'SHA-256 asset hash naming · Zero base64 bloat',
    },
    {
      id: 'vim',
      icon: <Terminal className="w-4 h-4" />,
      label: 'GhostKeys (Vim)',
      badge: 'Modal Drawing',
      title: 'GhostKeys: Modal Vim Drawing Engine',
      tagline: 'Draw, navigate, and save drawings without taking your hands off the keyboard.',
      bullets: [
        'True modal drawing: NORMAL mode for tool selection, INSERT mode for sketching',
        'Instant tool spawning: r (rectangle), d (diamond), e (ellipse), a (arrow), t (text)',
        'Vim file commands: :w for atomic disk write, :q to close scene',
        'Customizable keybindings and modal status bar indicator',
      ],
      techSpec: 'Zero-latency keyboard interceptor · EventBus architecture',
    },
    {
      id: 'plugins',
      icon: <Puzzle className="w-4 h-4" />,
      label: 'Plugin Marketplace',
      badge: 'Extensible API',
      title: 'Plugin Engine & Community Marketplace',
      tagline: 'Extend Excalideck with built-in productivity tools or build your own with TypeScript.',
      bullets: [
        'Habit Tracker: Generates interactive GitHub-style contribution heatmaps on canvas',
        'Study Calendar: Procedurally generates interactive study & schedule grids',
        'Community Marketplace: Install, toggle, and manage third-party plugins in 1 click',
        'Sandboxed PluginContext with isolated persistent key-value storage in Rust',
      ],
      techSpec: 'TypeScript Plugin API · Rust plugin_storage key-value backend',
    },
    {
      id: 'desktop',
      icon: <ShieldCheck className="w-4 h-4" />,
      label: 'Native Desktop Shell',
      badge: 'Tauri v2 + Rust',
      title: 'Native Cross-Platform Desktop App',
      tagline: 'Built with Tauri v2 for genuine native performance on macOS, Windows, and Linux.',
      bullets: [
        'macOS frameless window with native traffic lights and glass titlebar',
        'Built-in auto-updater with cryptographic SHA-256 release verification',
        'Automatic system theme synchronization (Dark / Light / System auto)',
        'Universal binaries for Apple Silicon (M1/M2/M3/M4), Intel, Windows 11, and Linux',
      ],
      techSpec: 'Tauri v2 · WebView2 / WebKit · Native Updater',
    },
  ];

  const current = features.find((f) => f.id === activeTab) || features[0];

  const handleTabSelect = (id: string) => {
    setActiveTab(id);
  };

  const handleLetterHover = (e: React.MouseEvent<HTMLSpanElement>, idx: number) => {
    animate(e.currentTarget, {
      scaleX: [1, 1.35, 0.9, 1],
      scaleY: [1, 0.7, 1.2, 1],
      translateY: [-10, 0],
      rotate: [0, (idx % 2 === 0 ? 8 : -8), 0],
      duration: 450,
      ease: 'outElastic(1.2, .4)',
    });
  };

  return (
    <section id="features" className="relative z-20 pt-20 pb-28 px-4 sm:px-6 max-w-7xl mx-auto select-none">
      
      {/* Section Header */}
      <div className="text-center max-w-4xl mx-auto mb-14 relative">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>TECHNICAL FEATURE BREAKDOWN</span>
        </div>
        
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2 cursor-pointer">
          {words.map((word, wIdx) => (
            <span key={wIdx} className="inline-block whitespace-nowrap">
              {word.split('').map((char, cIdx) => (
                <span
                  key={cIdx}
                  onMouseEnter={(e) => handleLetterHover(e, wIdx * 10 + cIdx)}
                  className="inline-block transition-colors duration-200 hover:text-indigo-500"
                >
                  {char}
                </span>
              ))}
            </span>
          ))}
        </h2>

        {/* Hand-Drawn Sketch Accent */}
        <div className="w-56 h-3 mx-auto mt-2 text-indigo-500/60">
          <svg viewBox="0 0 240 12" className="w-full h-full fill-none stroke-current stroke-[2.5]" strokeLinecap="round">
            <path d="M 5 6 Q 120 1, 235 7" />
          </svg>
        </div>

        <p className="text-zinc-600 dark:text-zinc-400 mt-4 text-base sm:text-lg max-w-2xl mx-auto">
          Every core system in Excalideck is built for local-first reliability, speed, and clean Git workflows.
        </p>
      </div>

      {/* Interactive Feature Navigation Ribbon */}
      <div className="flex items-center justify-center mb-8 overflow-x-auto p-1.5 max-w-full">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-black/10 dark:border-white/10 mac-window-shadow">
          {features.map((f) => (
            <button
              key={f.id}
              onClick={() => handleTabSelect(f.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === f.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {f.icon}
              <span className="whitespace-nowrap">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Feature Blueprint Stage */}
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 mac-window-shadow p-6 sm:p-10 backdrop-blur-xl transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Clear, High-Signal Feature Specs */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {current.badge}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {current.techSpec}
              </span>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                {current.title}
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                {current.tagline}
              </p>
            </div>

            {/* Crisp Bullet Points */}
            <div className="space-y-3 pt-2">
              {current.bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="leading-snug">{bullet}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column: Live Tactile Interactive Micro-Widget */}
          <div className="lg:col-span-5 flex items-center justify-center">
            
            {/* Widget 1: Interactive Vault File Tree */}
            {activeTab === 'vaults' && (
              <div className="w-full max-w-sm rounded-2xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950/90 p-4 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-black/5 dark:border-white/10 text-zinc-400">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">
                    <Folder className="w-3.5 h-3.5 text-indigo-500" />
                    <span>my-architecture-vault</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 px-1.5 py-0.5 rounded font-bold">Local</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-500 font-semibold">
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>01-Backend/</span>
                  </div>
                  {['Architecture.excalidraw', 'Database-Schema.excalidraw'].map((file) => (
                    <div
                      key={file}
                      onClick={() => setSelectedFolderFile(file)}
                      className={`ml-5 px-2 py-1 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                        selectedFolderFile === file
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">↳ {file}</span>
                      <span className="text-[9px] opacity-75">0ms</span>
                    </div>
                  ))}
                  
                  <div className="flex items-center gap-1.5 text-zinc-500 font-semibold pt-1">
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>02-UI-Flows/</span>
                  </div>
                  <div
                    onClick={() => setSelectedFolderFile('Design-System.excalidrawlib')}
                    className={`ml-5 px-2 py-1 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                      selectedFolderFile === 'Design-System.excalidrawlib'
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate">↳ Design-System.excalidrawlib</span>
                    <span className="text-[9px] opacity-75">Lib</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 text-[10px] text-zinc-400 flex items-center justify-between">
                  <span>Selected: <strong className="text-indigo-500">{selectedFolderFile}</strong></span>
                  <span className="text-emerald-500 font-bold">● Watching</span>
                </div>
              </div>
            )}

            {/* Widget 2: 0ms Canvas Speed Gauge */}
            {activeTab === 'speed' && (
              <div className="w-full max-w-sm rounded-2xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950/90 p-5 shadow-inner text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <div className="text-3xl font-black font-mono text-zinc-900 dark:text-white">
                  0.00 ms
                </div>
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  WebGL In-Memory Switch Time
                </div>

                <div className="mt-5 space-y-2 text-left font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 flex justify-between items-center">
                    <span className="text-zinc-500">Excalideck RAM:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">32 MB</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 flex justify-between items-center">
                    <span className="text-zinc-500">Electron RAM:</span>
                    <span className="font-bold text-rose-500">380 MB</span>
                  </div>
                </div>
              </div>
            )}

            {/* Widget 3: Decoupled Asset Offloader Preview */}
            {activeTab === 'assets' && (
              <div className="w-full max-w-sm rounded-2xl border border-black/10 dark:border-white/10 bg-[#0d1117] p-4 text-xs font-mono text-zinc-200 shadow-inner">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
                  <span>// diff --git a/Diagram.excalidraw</span>
                  <span className="text-emerald-400 font-bold">-99.2%</span>
                </div>
                
                <div className="space-y-1 text-[11px]">
                  <div className="text-zinc-500">&#123;</div>
                  <div className="ml-3 text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded">
                    + &quot;assetId&quot;: &quot;f9a2b0c1.png&quot;,
                  </div>
                  <div className="ml-3 text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded">
                    + &quot;type&quot;: &quot;image&quot;,
                  </div>
                  <div className="ml-3 text-zinc-400">&quot;x&quot;: 120, &quot;y&quot;: 240</div>
                  <div className="text-zinc-500">&#125;</div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
                  <span>Image extracted to <code className="text-indigo-400 font-bold">.assets/</code></span>
                  <span className="text-emerald-400">✓ Clean JSON</span>
                </div>
              </div>
            )}

            {/* Widget 4: GhostKeys Vim Simulator */}
            {activeTab === 'vim' && (
              <div className="w-full max-w-sm rounded-2xl border border-black/10 dark:border-white/10 bg-[#0d1117] p-4 text-xs font-mono text-zinc-200 shadow-inner">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold text-[10px]">
                    -- NORMAL MODE --
                  </span>
                  <span className="text-zinc-500 text-[10px]">:w active</span>
                </div>

                <div className="text-[11px] text-zinc-400 mb-3">
                  Click a Vim shortcut keycap:
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'r', label: 'Rect' },
                    { key: 'd', label: 'Diamond' },
                    { key: 'e', label: 'Ellipse' },
                    { key: ':w', label: 'Save' },
                  ].map((k) => (
                    <button
                      key={k.key}
                      onClick={() => setGhostKey(k.key)}
                      className={`p-2 rounded-xl text-center font-bold border transition-all cursor-pointer ${
                        ghostKey === k.key
                          ? 'border-indigo-500 bg-indigo-600 text-white shadow-md'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs">{k.key}</div>
                      <div className="text-[8px] opacity-75 font-normal">{k.label}</div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[10px] text-emerald-400 flex items-center justify-between">
                  <span>Selected: <strong className="text-white">{ghostKey}</strong></span>
                  <span>0ms response</span>
                </div>
              </div>
            )}

            {/* Widget 5: Plugin Studio Live Switcher */}
            {activeTab === 'plugins' && (
              <div className="w-full max-w-sm rounded-2xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950/90 p-4 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-black/5 dark:border-white/10">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Installed Plugins</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">Studio v1</span>
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'habit', name: 'Habit Tracker', desc: 'GitHub-style heatmap on canvas' },
                    { id: 'calendar', name: 'Study Calendar', desc: 'Interactive study schedule matrix' },
                    { id: 'ghost', name: 'GhostKeys (Vim)', desc: 'Modal drawing engine' },
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setActivePlugin(p.id as any)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        activePlugin === p.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 shadow-xs'
                          : 'border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white text-xs">{p.name}</div>
                        <div className="text-[10px] text-zinc-500">{p.desc}</div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2 text-[10px] text-zinc-400 flex items-center justify-between font-mono">
                  <span>Isolated PluginContext</span>
                  <span className="text-indigo-500 font-bold">Active: {activePlugin}</span>
                </div>
              </div>
            )}

            {/* Widget 6: Native Desktop App Window Chrome */}
            {activeTab === 'desktop' && (
              <div className="w-full max-w-sm rounded-2xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950/90 p-5 shadow-inner text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="text-base font-extrabold text-zinc-900 dark:text-white">
                  Tauri v2 + Rust Architecture
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Signed Binaries with Native System WebViews
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 text-left font-mono text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10">
                    <div className="text-zinc-400 text-[9px]">Memory</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">32MB Idle</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10">
                    <div className="text-zinc-400 text-[9px]">Updater</div>
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">SHA-256</div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

    </section>
  );
};
