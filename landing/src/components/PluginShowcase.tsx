import React, { useState } from 'react';
import { Blocks, ExternalLink } from 'lucide-react';
import { sound } from '../utils/sound';

export const PluginShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ghostkeys' | 'calendar' | 'custom'>('ghostkeys');

  const codeSnippets = {
    ghostkeys: `// Official Plugin: GhostKeys (Vim Modal Navigation)
import type { ExcalideckPlugin, PluginContext } from 'excalideck-api';

export const ghostKeysPlugin: ExcalideckPlugin = {
  activate(context: PluginContext) {
    // Register global Vim modal keybindings
    context.commands.register('ghostkeys:spawn-rectangle', () => {
      const { x, y } = context.canvas.getAppState().cursor;
      context.canvas.updateScene({
        elements: [
          ...context.canvas.getElements(),
          { type: 'rectangle', x, y, width: 240, height: 120 }
        ]
      });
    });

    // Inject active Vim mode into bottom status bar
    context.ui.registerStatusBarItem({
      id: 'ghostkeys-mode',
      render: () => <VimModeBadge mode="NORMAL" />
    });
  }
};`,
    calendar: `// Official Plugin: StudyCalendar (Procedural Schedule Grid)
import type { ExcalideckPlugin, PluginContext } from 'excalideck-api';

export const studyCalendarPlugin: ExcalideckPlugin = {
  activate(context: PluginContext) {
    context.ui.registerSidebarPanel({
      id: 'study-calendar-panel',
      title: 'Study Calendar',
      icon: 'CalendarIcon',
      render: () => (
        <CalendarGeneratorForm onGenerate={(month, days) => {
          const gridElements = buildCalendarGrid(month, days);
          context.canvas.updateScene({ elements: gridElements });
        }} />
      )
    });
  }
};`,
    custom: `// Build Your Own Excalideck Plugin in 5 Lines
import type { ExcalideckPlugin, PluginContext } from 'excalideck-api';

export const myPlugin: ExcalideckPlugin = {
  activate(context: PluginContext) {
    context.events.on('canvas:change', ({ elements }) => {
      context.logger.info(\`Active elements: \${elements.length}\`);
    });
  }
};`,
  };

  return (
    <div className="flex flex-col w-full bg-zinc-950 text-zinc-100 font-mono text-xs select-none">
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <Blocks className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-zinc-200">Excalideck Plugin Engine</span>
        </div>

        <div className="flex items-center gap-1">
          {[
            { id: 'ghostkeys', label: 'GhostKeys (Vim)' },
            { id: 'calendar', label: 'StudyCalendar' },
            { id: 'custom', label: 'Custom API' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { sound.playClick(); setActiveTab(t.id as any); }}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                activeTab === t.id ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-[#0d1117] min-h-[220px] overflow-x-auto">
        <pre className="text-zinc-300 font-mono leading-relaxed text-[11px]">
          <code>{codeSnippets[activeTab]}</code>
        </pre>
      </div>

      <div className="p-3 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between text-[11px]">
        <span className="text-emerald-400 font-semibold">✓ Full TypeScript isolation & zero-latency canvas lifecycle</span>
        <a
          href="https://github.com/GokulAnand14/excalideck/blob/main/PLUGINS.md"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sound.playPop()}
          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
        >
          <span>Read PLUGINS.md</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
