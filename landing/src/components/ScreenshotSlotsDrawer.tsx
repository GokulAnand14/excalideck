import React from 'react';
import { Camera, X, Check, Upload } from 'lucide-react';
import { sound } from '../utils/sound';

interface ScreenshotSlotsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  uploadedScreenshots: Record<string, string>;
  onUploadScreenshot: (slotId: string, url: string) => void;
}

export const ScreenshotSlotsDrawer: React.FC<ScreenshotSlotsDrawerProps> = ({
  isOpen,
  onClose,
  uploadedScreenshots,
  onUploadScreenshot,
}) => {
  if (!isOpen) return null;

  const slots = [
    {
      id: 'screenshot-hero',
      name: '1. Canvas & Main Workspace',
      resolution: '1920 x 1080 (16:9)',
      desc: 'Active canvas with hand-drawn diagram blocks, toolbar, and dark/light UI.',
    },
    {
      id: 'screenshot-vault',
      name: '2. Vault Explorer & File Tree',
      resolution: '1200 x 800 (4:3)',
      desc: 'Sidebar open showing nested folder hierarchy, search filtering, and file tree.',
    },
    {
      id: 'screenshot-vim',
      name: '3. GhostKeys Vim Modal Engine',
      resolution: '1200 x 800 (4:3)',
      desc: 'Active canvas with GhostKeys mode indicator (--NORMAL--) and status bar.',
    },
    {
      id: 'screenshot-diff',
      name: '4. Asset Isolation & Clean Git Diff',
      resolution: '1200 x 800 (16:10)',
      desc: 'Terminal or Git diff showing .assets/ extraction vs standard base64 bloat.',
    },
    {
      id: 'screenshot-plugins',
      name: '5. Plugin Ecosystem & Settings',
      resolution: '1200 x 800 (4:3)',
      desc: 'Sidebar plugin tab showing StudyCalendar & GhostKeys official plugins.',
    },
  ];

  const handleFile = (slotId: string, file: File) => {
    const url = URL.createObjectURL(file);
    onUploadScreenshot(slotId, url);
    sound.playSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-2xl rounded-3xl border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900 mac-window-shadow overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                App Screenshot Slots Guide
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Drop or upload your screenshots to preview them live in the desktop windows.
              </p>
            </div>
          </div>

          <button
            onClick={() => { sound.playClick(); onClose(); }}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          {slots.map((s) => {
            const hasUpload = Boolean(uploadedScreenshots[s.id]);
            return (
              <div
                key={s.id}
                className={`p-4 rounded-2xl border transition-all ${
                  hasUpload
                    ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-black/5 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-800/40'
                } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white">
                      {s.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {s.resolution}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">
                    {s.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hasUpload ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                        <Check className="w-4 h-4" /> Loaded
                      </span>
                      <label className="cursor-pointer px-3 py-1.5 text-xs font-medium rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 transition-colors">
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFile(s.id, e.target.files[0])}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload PNG</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFile(s.id, e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-black/5 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Uploaded images stay in-memory in your local session</span>
          <button
            onClick={() => { sound.playClick(); onClose(); }}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
