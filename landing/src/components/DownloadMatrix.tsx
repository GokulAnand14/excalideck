import React from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { sound } from '../utils/sound';
import { AppleIcon, WindowsIcon, LinuxIcon } from './Icons';
import { animate } from 'animejs';

export const DownloadMatrix: React.FC = () => {
  const words = ["Download", "Excalideck."];

  const handleLetterHover = (e: React.MouseEvent<HTMLSpanElement>, idx: number) => {
    animate(e.currentTarget, {
      scaleX: [1, 1.4, 0.9, 1],
      scaleY: [1, 0.7, 1.2, 1],
      translateY: [-12, 0],
      rotate: [0, (idx % 2 === 0 ? 10 : -10), 0],
      duration: 500,
      ease: 'outElastic(1.2, .4)',
    });
  };

  const handleCardHover = (e: React.MouseEvent<HTMLDivElement>) => {
    animate(e.currentTarget, {
      scaleX: [1, 1.025, 0.98, 1],
      scaleY: [1, 0.975, 1.015, 1],
      duration: 450,
      ease: 'outElastic(1.2, .4)',
    });
  };

  return (
    <section id="downloads" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto select-none">
      <div className="text-center max-w-3xl mx-auto mb-14 relative">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 mb-3 shadow-xs">
          <Download className="w-3.5 h-3.5" />
          <span>OFFICIAL GITHUB RELEASES · V0.1.9</span>
        </div>
        
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex flex-wrap items-center justify-center gap-x-3 gap-y-2 cursor-pointer">
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

        <div className="w-36 h-3 mx-auto mt-2 text-indigo-500/60">
          <svg viewBox="0 0 140 12" className="w-full h-full fill-none stroke-current stroke-[2.5]" strokeLinecap="round">
            <path d="M 5 6 Q 70 2, 135 7" />
          </svg>
        </div>

        <p className="text-zinc-600 dark:text-zinc-400 mt-3 text-base sm:text-lg">
          Pre-compiled native binaries are available directly on GitHub Releases. 100% Free and Open Source under MIT.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* macOS */}
        <div
          onMouseEnter={handleCardHover}
          className="p-7 rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 mac-window-shadow flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-xl transition-all cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
                <AppleIcon className="w-4 h-4" />
                <span>macOS</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Apple Silicon & Intel</span>
            </div>

            <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white">
              macOS Installer
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Supports macOS Sonoma 14.0 or higher.
            </p>

            <div className="mt-6 space-y-2">
              <a
                href="https://github.com/GokulAnand14/excalideck/releases"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playSuccess()}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <AppleIcon className="w-3.5 h-3.5" />
                <span>Download Apple Silicon (.dmg)</span>
              </a>
              <a
                href="https://github.com/GokulAnand14/excalideck/releases"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playClick()}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Download Intel Mac (.dmg)</span>
              </a>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
            <span>Signed Universal Binary</span>
            <span className="text-emerald-500 font-semibold">v0.1.9</span>
          </div>
        </div>

        {/* Windows */}
        <div
          onMouseEnter={handleCardHover}
          className="p-7 rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 mac-window-shadow flex flex-col justify-between hover:border-blue-500/50 hover:shadow-xl transition-all cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <WindowsIcon className="w-4 h-4" />
                <span>Windows</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">x64 / x86_64</span>
            </div>

            <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white">
              Windows Package
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Supports Windows 10 & 11 (64-bit).
            </p>

            <div className="mt-6 space-y-2">
              <a
                href="https://github.com/GokulAnand14/excalideck/releases"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playSuccess()}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <WindowsIcon className="w-3.5 h-3.5" />
                <span>Windows Setup (.msi)</span>
              </a>
              <a
                href="https://github.com/GokulAnand14/excalideck/releases"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playClick()}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Portable Executable (.exe)</span>
              </a>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
            <span>WebView2 Native Container</span>
            <span className="text-emerald-500 font-semibold">v0.1.9</span>
          </div>
        </div>

        {/* Linux */}
        <div
          onMouseEnter={handleCardHover}
          className="p-7 rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 mac-window-shadow flex flex-col justify-between hover:border-amber-500/50 hover:shadow-xl transition-all cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <LinuxIcon className="w-4 h-4" />
                <span>Linux</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Universal x86_64</span>
            </div>

            <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white">
              Linux Package
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Supports Ubuntu, Debian, Fedora, Arch, and more.
            </p>

            <div className="mt-6 space-y-2">
              <a
                href="https://github.com/GokulAnand14/excalideck/releases"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playSuccess()}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <LinuxIcon className="w-3.5 h-3.5" />
                <span>Universal (.AppImage)</span>
              </a>
              <a
                href="https://github.com/GokulAnand14/excalideck/releases"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playClick()}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Debian / Ubuntu (.deb)</span>
              </a>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
            <span>Standalone Binary</span>
            <span className="text-emerald-500 font-semibold">v0.1.9</span>
          </div>
        </div>

      </div>

      {/* GitHub Releases Direct Link Banner */}
      <div className="p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-zinc-950 text-zinc-100 font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-4 mac-window-shadow">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-zinc-800 flex items-center justify-center text-indigo-400">
            <ExternalLink className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-zinc-200">GitHub Releases Hub</div>
            <div className="text-zinc-400 text-xs mt-0.5">View release notes, changelogs, and SHA-256 checksums on GitHub.</div>
          </div>
        </div>

        <a
          href="https://github.com/GokulAnand14/excalideck/releases"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sound.playPop()}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs border border-zinc-700 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <span>View All Releases</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

    </section>
  );
};
