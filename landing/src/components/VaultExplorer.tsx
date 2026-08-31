import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, Search, ChevronRight, ChevronDown, Sparkles, HardDrive } from 'lucide-react';
import { sound } from '../utils/sound';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  size?: string;
}

export const VaultExplorer: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeFile, setActiveFile] = useState('System-Architecture.excalidraw');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'architecture': true,
    'ui': true,
    'daily': false,
    'assets': true,
  });
  const [latencyPing, setLatencyPing] = useState<string | null>(null);

  const vaultData: FileNode[] = [
    {
      id: 'architecture',
      name: 'Architecture',
      type: 'folder',
      children: [
        { id: 'f1', name: 'System-Architecture.excalidraw', type: 'file', size: '14 KB' },
        { id: 'f2', name: 'Rust-IPC-Flow.excalidraw', type: 'file', size: '8 KB' },
        { id: 'f3', name: 'Database-Schema.excalidraw', type: 'file', size: '22 KB' },
      ],
    },
    {
      id: 'ui',
      name: 'UI-Design',
      type: 'folder',
      children: [
        { id: 'f4', name: 'Desktop-Frameless-Shell.excalidraw', type: 'file', size: '18 KB' },
        { id: 'f5', name: 'Component-Library.excalidraw', type: 'file', size: '32 KB' },
      ],
    },
    {
      id: 'daily',
      name: 'Daily-Sketches',
      type: 'folder',
      children: [
        { id: 'f6', name: '2026-08-31-Sprint-Retro.excalidraw', type: 'file', size: '6 KB' },
      ],
    },
    {
      id: 'assets',
      name: '.assets (Isolated)',
      type: 'folder',
      children: [
        { id: 'a1', name: 'arch-hero-c8f9.png', type: 'file', size: '420 KB' },
        { id: 'a2', name: 'ui-mock-a1b2.png', type: 'file', size: '280 KB' },
      ],
    },
  ];

  const toggleFolder = (folderId: string) => {
    sound.playClick();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const selectFile = (fileName: string) => {
    sound.playPop();
    setActiveFile(fileName);
    setLatencyPing('0ms In-Memory Hydration');
    setTimeout(() => setLatencyPing(null), 2000);
  };

  return (
    <div className="flex flex-col md:flex-row w-full min-h-[360px] bg-white dark:bg-zinc-950 font-sans text-xs select-none">
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-black/5 dark:border-white/10 p-3 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-zinc-800 dark:text-zinc-200">my-project-vault</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
              Local Disk
            </span>
          </div>

          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Fuzzy search sketches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-black/5 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[220px]">
            {vaultData.map((folder) => {
              const isExpanded = expandedFolders[folder.id];
              const matchingFiles = folder.children?.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())) || [];
              if (search && matchingFiles.length === 0) return null;

              return (
                <div key={folder.id} className="space-y-0.5">
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors text-left"
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
                    {isExpanded ? <FolderOpen className="w-3.5 h-3.5 text-amber-500" /> : <Folder className="w-3.5 h-3.5 text-amber-500" />}
                    <span className="font-semibold truncate">{folder.name}</span>
                  </button>

                  {isExpanded && (
                    <div className="ml-5 pl-1.5 border-l border-zinc-200 dark:border-zinc-800 space-y-0.5">
                      {matchingFiles.map((file) => {
                        const isActive = activeFile === file.name;
                        return (
                          <button
                            key={file.id}
                            onClick={() => selectFile(file.name)}
                            className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-left transition-all ${
                              isActive
                                ? 'bg-indigo-600 text-white font-medium shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
                              <span className="truncate">{file.name}</span>
                            </div>
                            <span className={`text-[10px] font-mono shrink-0 ml-1 ${isActive ? 'text-indigo-200' : 'text-zinc-400'}`}>
                              {file.size}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>7 sketches · 0 cloud</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">Git Synced</span>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-between bg-zinc-100/40 dark:bg-zinc-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            <span>vault</span>
            <span>/</span>
            <span>Architecture</span>
            <span>/</span>
            <span className="text-zinc-900 dark:text-white font-semibold">{activeFile}</span>
          </div>

          {latencyPing && (
            <div className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold border border-emerald-300 dark:border-emerald-800 animate-pulse">
              ⚡ {latencyPing}
            </div>
          )}
        </div>

        <div className="my-6 p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 mac-window-shadow flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>

          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
            {activeFile}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
            Stored as standard atomic JSON on your filesystem. Embedded images are decoupled and auto-extracted to <code className="font-mono text-indigo-600 dark:text-indigo-400">.assets/</code>.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
              WebGL Context Alive
            </div>
            <div className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-semibold">
              0ms Switch Latency
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Rust notify watcher: Active</span>
          <span>Hashed dirty-state auto-save</span>
        </div>
      </div>
    </div>
  );
};
