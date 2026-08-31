import React, { useState } from 'react';
import { GitCompare, Check, ShieldAlert } from 'lucide-react';
import { sound } from '../utils/sound';

export const GitDiffViewer: React.FC = () => {
  const [view, setView] = useState<'excalideck' | 'standard'>('excalideck');

  return (
    <div className="flex flex-col w-full bg-zinc-950 text-zinc-100 font-mono text-xs overflow-hidden select-none">
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-zinc-200">Asset Isolation & Git Diff Inspection</span>
        </div>

        <div className="flex items-center p-0.5 rounded-lg bg-zinc-800 border border-zinc-700">
          <button
            onClick={() => { sound.playClick(); setView('excalideck'); }}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
              view === 'excalideck' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Excalideck (Clean)
          </button>
          <button
            onClick={() => { sound.playClick(); setView('standard'); }}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
              view === 'standard' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Standard Base64 Bloat
          </button>
        </div>
      </div>

      <div className="p-4 overflow-x-auto min-h-[240px] bg-[#0d1117] space-y-1">
        {view === 'excalideck' ? (
          <>
            <div className="text-emerald-400 font-semibold mb-2 flex items-center gap-1.5 text-[11px]">
              <Check className="w-3.5 h-3.5" />
              <span>Excalideck Git Diff: Decoupled Assets in .assets/ · Clean Human-Readable JSON</span>
            </div>
            <div className="text-zinc-500">// diff --git a/Diagram.excalidraw b/Diagram.excalidraw</div>
            <div className="text-zinc-400">@@ -14,6 +14,7 @@</div>
            <div className="text-zinc-300">&nbsp;&nbsp;&#123;</div>
            <div className="text-zinc-300">&nbsp;&nbsp;&nbsp;&nbsp;"id": "server-node-1",</div>
            <div className="text-zinc-300">&nbsp;&nbsp;&nbsp;&nbsp;"type": "image",</div>
            <div className="text-emerald-400 bg-emerald-950/40 px-1 rounded font-bold">
              +&nbsp;&nbsp;&nbsp;"assetId": "c8f9d0e1f2.png", // Extracted to .assets/ (38 KB)
            </div>
            <div className="text-emerald-400 bg-emerald-950/40 px-1 rounded">
              +&nbsp;&nbsp;&nbsp;"label": "Auth Microservice",
            </div>
            <div className="text-emerald-400 bg-emerald-950/40 px-1 rounded">
              +&nbsp;&nbsp;&nbsp;"status": "healthy"
            </div>
            <div className="text-zinc-300">&nbsp;&nbsp;&#125;</div>
            <div className="mt-3 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
              <span>File size: <strong>4.2 KB</strong></span>
              <span className="text-emerald-400">Diff lines: +3 lines (Easy Code Review)</span>
            </div>
          </>
        ) : (
          <>
            <div className="text-rose-400 font-semibold mb-2 flex items-center gap-1.5 text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Standard Excalidraw Diff: Giant Base64 Bloat (Crashes GitHub Diff View)</span>
            </div>
            <div className="text-zinc-500">// diff --git a/Diagram.excalidraw b/Diagram.excalidraw</div>
            <div className="text-zinc-400">@@ -14,18490 +14,18490 @@</div>
            <div className="text-rose-400 bg-rose-950/40 px-1 rounded truncate">
              + "fileId": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAH0CAYAAABz5ZzDAAA...[18,400 lines truncated]
            </div>
            <div className="text-rose-400 bg-rose-950/40 px-1 rounded truncate">
              + ...iVBORw0KGgoAAAANSUhEUgAAAlgAAAH0CAYAAABz5ZzDAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUU...
            </div>
            <div className="text-rose-400 bg-rose-950/40 px-1 rounded truncate">
              + ...5h0K0e+8p2lA5c1wY3yvG2y8h/d7b5t/e29v8v7r8/v1e...
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-800 text-[11px] text-rose-400 flex items-center justify-between">
              <span>File size: <strong>4.8 MB (JSON Bloat)</strong></span>
              <span>Diff lines: +18,490 lines (Unreviewable)</span>
            </div>
          </>
        )}
      </div>

      <div className="p-3 bg-zinc-900/80 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold">99.2% smaller Git diffs</span>
          <span className="text-zinc-400">Zero merge conflicts</span>
        </div>
        <span className="text-indigo-400 font-medium">Rust background extraction worker</span>
      </div>
    </div>
  );
};
