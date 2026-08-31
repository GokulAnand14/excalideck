import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Moon, Sun, Github } from 'lucide-react';
import { sound } from '../utils/sound';
import { detectOS, getOSDownloadInfo, OSDownloadInfo } from '../utils/os';
import { AppleIcon, WindowsIcon, LinuxIcon } from './Icons';
import { animate } from 'animejs';

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDark,
  onToggleTheme,
  isMuted,
  onToggleMute,
}) => {
  const [osInfo, setOsInfo] = useState<OSDownloadInfo>(getOSDownloadInfo('mac'));
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const os = detectOS();
    setOsInfo(getOSDownloadInfo(os));

    if (headerRef.current) {
      animate(headerRef.current, {
        translateY: [-24, 0],
        opacity: [0, 1],
        duration: 700,
        ease: 'outExpo',
      });
    }
  }, []);

  const renderOSIcon = () => {
    switch (osInfo.os) {
      case 'windows':
        return <WindowsIcon className='w-3.5 h-3.5' />;
      case 'linux':
        return <LinuxIcon className='w-3.5 h-3.5' />;
      case 'mac':
      default:
        return <AppleIcon className='w-3.5 h-3.5' />;
    }
  };

  return (
    <header
      ref={headerRef}
      className='fixed top-0 left-0 right-0 z-50 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between pointer-events-none select-none opacity-0'
    >
      <div className='pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-sm'>
        <div className='w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 p-0.5 shadow-xs flex items-center justify-center'>
          <img src='/logo.png' alt='Excalideck' className='w-full h-full object-contain rounded-md' />
        </div>
        <span className='font-extrabold text-sm tracking-tight text-zinc-900 dark:text-white'>
          excalideck
        </span>
        <span className='text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-semibold'>
          v0.1.9
        </span>
      </div>

      <div className='pointer-events-auto flex items-center gap-2'>
        <button
          onClick={onToggleMute}
          aria-label='Toggle Sound Effects'
          className='p-2 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/5 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer'
          title={isMuted ? 'Enable sound effects' : 'Mute sound effects'}
        >
          {isMuted ? <VolumeX className='w-4 h-4 text-zinc-400' /> : <Volume2 className='w-4 h-4 text-indigo-500' />}
        </button>

        <button
          onClick={() => { sound.playSnap(); onToggleTheme(); }}
          aria-label='Toggle Theme'
          className='p-2 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/5 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer'
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun className='w-4 h-4 text-amber-400' /> : <Moon className='w-4 h-4 text-zinc-700' />}
        </button>

        <a
          href='https://github.com/GokulAnand14/excalideck'
          target='_blank'
          rel='noopener noreferrer'
          onClick={() => sound.playPop()}
          className='hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/5 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-sm hover:scale-105 active:scale-95 transition-all'
        >
          <Github className='w-3.5 h-3.5' />
          <span>Star</span>
          <span className='text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500'>MIT</span>
        </a>

        <a
          href={osInfo.downloadUrl}
          target='_blank'
          rel='noopener noreferrer'
          onClick={() => sound.playSuccess()}
          className='flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all'
        >
          {renderOSIcon()}
          <span>{osInfo.name}</span>
        </a>
      </div>
    </header>
  );
};
