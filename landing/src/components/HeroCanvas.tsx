import React, { useEffect, useRef, useState } from 'react';
import { Github, ArrowDown, Heart } from 'lucide-react';
import { sound } from '../utils/sound';
import { AnimatedCanvasBackdrop } from './AnimatedCanvasBackdrop';
import { detectOS, getOSDownloadInfo, OSDownloadInfo } from '../utils/os';
import { AppleIcon, WindowsIcon, LinuxIcon } from './Icons';
import { animate, stagger } from 'animejs';

export const HeroCanvas: React.FC = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const authorBadgeRef = useRef<HTMLAnchorElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const brandWord = 'excalideck'.split('');
  const [osInfo, setOsInfo] = useState<OSDownloadInfo>(getOSDownloadInfo('mac'));

  useEffect(() => {
    const os = detectOS();
    setOsInfo(getOSDownloadInfo(os));

    // 1. Kinetic letters entrance: t = 200ms
    if (titleRef.current) {
      const letters = titleRef.current.querySelectorAll('.hero-letter');
      animate(letters, {
        translateY: [45, 0],
        opacity: [0, 1],
        rotate: [12, 0],
        scale: [0.85, 1],
        delay: stagger(35, { start: 200 }),
        duration: 800,
        ease: 'outElastic(1, .6)',
      });
    }

    // 2. Subtitle entrance: t = 500ms
    if (subtitleRef.current) {
      animate(subtitleRef.current, {
        translateY: [20, 0],
        opacity: [0, 1],
        delay: 500,
        duration: 650,
        ease: 'outExpo',
      });
    }

    // 3. CTA Buttons entrance: t = 650ms
    if (ctaRef.current) {
      animate(ctaRef.current, {
        scale: [0.92, 1],
        opacity: [0, 1],
        translateY: [15, 0],
        delay: 650,
        duration: 650,
        ease: 'outBack(1.4)',
      });
    }

    // 4. Author Doodle entrance: t = 800ms
    if (authorBadgeRef.current) {
      animate(authorBadgeRef.current, {
        scale: [0.85, 1],
        opacity: [0, 1],
        delay: 800,
        duration: 600,
        ease: 'outBack(1.5)',
      });
    }
  }, []);

  // Slimy Jelly Elastic Interaction on Hover
  const handleLetterHover = (e: React.MouseEvent<HTMLSpanElement>, index: number) => {
    sound.playSlimeSquish(380 + (index * 30));
    
    animate(e.currentTarget, {
      scaleX: [1, 1.45, 0.85, 1.1, 1],
      scaleY: [1, 0.65, 1.25, 0.95, 1],
      translateY: [-22, 4, -8, 0],
      rotate: [0, (index % 2 === 0 ? 14 : -14), -6, 0],
      color: ['#6366f1', '#ec4899', '#10b981', 'inherit'],
      duration: 750,
      ease: 'outElastic(1.2, .4)',
    });

    if (containerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const drop = document.createElement('div');
      drop.className = 'pointer-events-none fixed z-50 w-3 h-3 rounded-full bg-gradient-to-tr from-indigo-500 via-pink-500 to-purple-400 shadow-md shadow-indigo-500/50';
      drop.style.left = `${rect.left + rect.width / 2}px`;
      drop.style.top = `${rect.top}px`;
      containerRef.current.appendChild(drop);

      animate(drop, {
        translateY: [-40 - Math.random() * 30],
        translateX: [(Math.random() - 0.5) * 60],
        scale: [1, 1.8, 0],
        opacity: [1, 0],
        duration: 650,
        ease: 'outQuad',
        onComplete: () => {
          if (drop.parentNode) {
            drop.parentNode.removeChild(drop);
          }
        },
      });
    }
  };

  const handleAuthorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    sound.playSuccess();
    const badge = e.currentTarget;
    const rect = badge.getBoundingClientRect();

    // Spawn 12 floating hearts using Anime.js
    for (let i = 0; i < 12; i++) {
      const heart = document.createElement('div');
      heart.className = 'pointer-events-none fixed z-50 text-rose-500 text-sm select-none';
      heart.innerHTML = '❤️';
      heart.style.left = `${rect.left + rect.width / 2}px`;
      heart.style.top = `${rect.top}px`;
      document.body.appendChild(heart);

      const angle = (Math.PI * 2 * i) / 12;
      const distance = 40 + Math.random() * 50;

      animate(heart, {
        translateX: [Math.cos(angle) * distance],
        translateY: [Math.sin(angle) * distance - 25],
        scale: [0.8, 1.4, 0],
        opacity: [1, 0],
        duration: 650 + Math.random() * 200,
        ease: 'outExpo',
        onComplete: () => {
          if (heart.parentNode) {
            heart.parentNode.removeChild(heart);
          }
        },
      });
    }
  };

  const renderOSIcon = (os: string) => {
    switch (os) {
      case 'windows':
        return <WindowsIcon className="w-5 h-5" />;
      case 'linux':
        return <LinuxIcon className="w-5 h-5" />;
      case 'mac':
      default:
        return <AppleIcon className="w-5 h-5" />;
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-[100dvh] w-full canvas-grid flex flex-col items-center justify-center text-center px-4 sm:px-6 overflow-hidden select-none">
      
      {/* Animated Organic Gradient Blobs & Excalidraw Hand-Drawn Doodles */}
      <AnimatedCanvasBackdrop />

      {/* Centered Content Stack */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center">
        
        {/* Monumental Centered Title with Slimy Rubber Elastic Letters */}
        <h1
          ref={titleRef}
          className="text-7xl sm:text-9xl lg:text-[11rem] font-black tracking-tighter text-zinc-950 dark:text-white leading-none my-2 cursor-pointer"
        >
          {brandWord.map((char, index) => (
            <span
              key={index}
              onMouseEnter={(e) => handleLetterHover(e, index)}
              className="hero-letter inline-block transition-colors duration-200 select-none opacity-0"
            >
              {char}
            </span>
          ))}
        </h1>

        {/* Clean Editorial Subtitle */}
        <div ref={subtitleRef} className="opacity-0">
          <p className="mt-5 text-lg sm:text-2xl font-semibold text-zinc-800 dark:text-zinc-200 max-w-2xl leading-relaxed tracking-tight">
            Excalidraw, excelled with an Obsidian-grade vault system.
          </p>

          <p className="mt-2 text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
            The local-first desktop sketchbook with zero cloud lock-in, atomic persistence, and instant scene switching.
          </p>
        </div>

        {/* Sleek Action CTAs */}
        <div ref={ctaRef} className="mt-10 flex flex-wrap items-center justify-center gap-3 opacity-0">
          
          {/* Primary Detected OS Button */}
          <a
            href={osInfo.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sound.playSuccess()}
            className="group relative px-8 py-3.5 rounded-2xl text-sm sm:text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-xl shadow-indigo-600/30 flex items-center gap-3 transition-all hover:scale-105 overflow-hidden"
          >
            <div className="p-1 rounded-lg bg-white/15">
              {renderOSIcon(osInfo.os)}
            </div>
            <div className="text-left">
              <div className="leading-tight">{osInfo.name}</div>
              <div className="text-[10px] font-normal text-indigo-200 font-mono">{osInfo.secondaryText}</div>
            </div>
          </a>

          {/* Secondary: All Platforms Link */}
          <a
            href="#downloads"
            onClick={() => sound.playClick()}
            className="px-6 py-3.5 rounded-2xl text-sm sm:text-base font-bold text-zinc-900 dark:text-white bg-white/90 dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-black/10 dark:border-white/10 active:scale-95 shadow-sm flex items-center gap-2.5 transition-all hover:scale-105"
          >
            <div className="flex items-center gap-1.5 text-zinc-400">
              <AppleIcon className="w-3.5 h-3.5" />
              <WindowsIcon className="w-3.5 h-3.5" />
              <LinuxIcon className="w-3.5 h-3.5" />
            </div>
            <span>All Platforms</span>
          </a>

          {/* GitHub Star */}
          <a
            href="https://github.com/GokulAnand14/excalideck"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sound.playPop()}
            className="px-5 py-3.5 rounded-2xl text-sm sm:text-base font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100/90 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all flex items-center gap-2 border border-black/5 dark:border-white/5"
          >
            <Github className="w-5 h-5" />
            <span>GitHub</span>
          </a>
        </div>

        {/* Excalidraw Style Hand-Drawn "Made with ❤️ by Gokul Anand" Badge */}
        <a
          ref={authorBadgeRef}
          href="https://github.com/GokulAnand14"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAuthorClick}
          className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl border-2 border-indigo-500/30 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:border-pink-500/60 hover:scale-105 active:scale-95 transition-all shadow-xs group cursor-pointer opacity-0"
          title="Visit Gokul Anand's GitHub profile (Click for heart shower!)"
        >
          <span className="text-zinc-500 dark:text-zinc-400">Made with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 group-hover:scale-125 transition-transform animate-pulse" />
          <span className="font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            by Gokul Anand
          </span>
          <svg className="w-3.5 h-3.5 text-indigo-500 stroke-current fill-none stroke-[2] -rotate-12 group-hover:rotate-0 transition-transform" viewBox="0 0 24 24">
            <path d="M 4 12 Q 12 4, 20 10" />
            <polyline points="15,6 20,10 16,15" />
          </svg>
        </a>

        {/* Minimalist Micro Specs */}
        <div className="mt-4 flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
          <span>100% free & open source</span>
          <span>·</span>
          <span>local-first</span>
          <span>·</span>
          <span>native rust & tauri v2</span>
        </div>

      </div>

      {/* Scroll Down Prompt */}
      <a
        href="#features"
        onClick={() => sound.playClick()}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 p-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-black/10 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white shadow-sm animate-bounce cursor-pointer"
        aria-label="Scroll to features"
      >
        <ArrowDown className="w-4 h-4" />
      </a>

      {/* Seamless bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-[#faf9f6] dark:to-[#0c0d0e] pointer-events-none" />

    </div>
  );
};
