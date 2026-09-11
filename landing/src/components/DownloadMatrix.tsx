import React from 'react';
import { Download, ExternalLink, Smartphone } from 'lucide-react';
import { sound } from '../utils/sound';
import { AppleIcon, WindowsIcon, LinuxIcon, AndroidIcon } from './Icons';
import { DIRECT_DOWNLOADS } from '../utils/os';
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
          <span>OFFICIAL DIRECT DOWNLOADS · V0.2.0</span>
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
          Click any installer below to start downloading directly. Native binaries for desktop and mobile. 100% Free and Open Source under MIT.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* macOS */}
        <div
          onMouseEnter={handleCardHover}
          className="p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 mac-window-shadow flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-xl transition-all cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
                <AppleIcon className="w-4 h-4" />
                <span>macOS</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Silicon & Intel</span>
            </div>

            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">
              macOS Universal
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Supports macOS Sonoma 14.0 or higher.
            </p>

            <div className="mt-6 space-y-2">
              <a
                href={DIRECT_DOWNLOADS.mac.dmg}
                download="Excalideck_0.2.0_universal.dmg"
                onClick={() => sound.playSuccess()}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <AppleIcon className="w-3.5 h-3.5" />
                <span>Download DMG (.dmg)</span>
              </a>
              <a
                href={DIRECT_DOWNLOADS.mac.tar}
                download="Excalideck_universal.app.tar.gz"
                onClick={() => sound.playClick()}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>App Tarball (.tar.gz)</span>
              </a>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
            <span>Signed Universal</span>
            <span className="text-emerald-500 font-semibold">v0.2.0</span>
          </div>
        </div>

        {/* Windows */}
        <div
          onMouseEnter={handleCardHover}
          className="p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 mac-window-shadow flex flex-col justify-between hover:border-blue-500/50 hover:shadow-xl transition-all cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <WindowsIcon className="w-4 h-4" />
                <span>Windows</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">x64 / 64-bit</span>
            </div>

            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">
              Windows Installer
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Supports Windows 10 & 11 (64-bit).
            </p>

            <div className="mt-6 space-y-2">
              <a
                href={DIRECT_DOWNLOADS.windows.exe}
                download="Excalideck_0.2.0_x64-setup.exe"
                onClick={() => sound.playSuccess()}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <WindowsIcon className="w-3.5 h-3.5" />
                <span>Setup Executable (.exe)</span>
              </a>
              <a
                href={DIRECT_DOWNLOADS.windows.msi}
                download="Excalideck_0.2.0_x64_en-US.msi"
                onClick={() => sound.playClick()}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>MSI Installer (.msi)</span>
              </a>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
            <span>WebView2 Native</span>
            <span className="text-emerald-500 font-semibold">v0.2.0</span>
          </div>
        </div>

        {/* Linux */}
        <div
          onMouseEnter={handleCardHover}
          className="p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 mac-window-shadow flex flex-col justify-between hover:border-amber-500/50 hover:shadow-xl transition-all cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <LinuxIcon className="w-4 h-4" />
                <span>Linux</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">x86_64</span>
            </div>

            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">
              Linux Package
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Ubuntu, Debian, Fedora, Arch, and more.
            </p>

            <div className="mt-6 space-y-2">
              <a
                href={DIRECT_DOWNLOADS.linux.appImage}
                download="Excalideck_0.2.0_amd64.AppImage"
                onClick={() => sound.playSuccess()}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <LinuxIcon className="w-3.5 h-3.5" />
                <span>AppImage (.AppImage)</span>
              </a>
              <a
                href={DIRECT_DOWNLOADS.linux.deb}
                download="Excalideck_0.2.0_amd64.deb"
                onClick={() => sound.playClick()}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Debian Package (.deb)</span>
              </a>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
            <span>Standalone Binary</span>
            <span className="text-emerald-500 font-semibold">v0.2.0</span>
          </div>
        </div>

        {/* Android */}
        <div
          onMouseEnter={handleCardHover}
          className="p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 mac-window-shadow flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-xl transition-all cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <AndroidIcon className="w-4 h-4" />
                <span>Android</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">ARM64 & x86_64</span>
            </div>

            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">
              Android APK
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Supports Android 8.0+ tablets & phones.
            </p>

            <div className="mt-6 space-y-2">
              <a
                href={DIRECT_DOWNLOADS.android.apk}
                download="Excalideck_0.2.0_universal.apk"
                onClick={() => sound.playSuccess()}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <AndroidIcon className="w-3.5 h-3.5" />
                <span>Download APK (.apk)</span>
              </a>
              <a
                href={DIRECT_DOWNLOADS.android.localDevApk}
                download="Excalideck_0.2.0_universal.apk"
                onClick={() => sound.playClick()}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                title="Direct high-speed local network install if on same Wi-Fi"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Wi-Fi Fast Install</span>
              </a>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
            <span>Sandboxed Storage</span>
            <span className="text-emerald-500 font-semibold">v0.2.0</span>
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
