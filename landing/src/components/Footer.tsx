import React, { useRef } from 'react';
import { Github, Sparkles, ArrowUp } from 'lucide-react';
import { sound } from '../utils/sound';
import { animate } from 'animejs';

export const Footer: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);

  const handleConfettiShower = (e: React.MouseEvent<HTMLButtonElement>) => {
    sound.playSuccess();
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();

    for (let i = 0; i < 24; i++) {
      const p = document.createElement('div');
      p.className = 'pointer-events-none fixed z-50 w-2.5 h-2.5 rounded-full shadow-xs';
      const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];
      p.style.backgroundColor = colors[i % colors.length];
      p.style.left = (rect.left + rect.width / 2) + 'px';
      p.style.top = rect.top + 'px';
      document.body.appendChild(p);

      const angle = (Math.PI * 2 * i) / 24;
      const distance = 60 + Math.random() * 80;

      animate(p, {
        translateX: [Math.cos(angle) * distance],
        translateY: [Math.sin(angle) * distance - 30],
        scale: [1, 1.5, 0],
        opacity: [1, 0],
        duration: 750 + Math.random() * 250,
        ease: 'outExpo',
        onComplete: () => {
          if (p.parentNode) {
            p.parentNode.removeChild(p);
          }
        },
      });
    }
  };

  const scrollToTop = () => {
    sound.playSnap();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer ref={footerRef} className='border-t border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl py-12 px-4 sm:px-6 relative select-none'>
      <div className='max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6'>
        
        {/* Brand & MIT License */}
        <div className='flex items-center gap-3'>
          <div className='w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-0.5 shadow-xs flex items-center justify-center'>
            <img src='/logo.png' alt='Excalideck' className='w-full h-full object-contain rounded-lg' />
          </div>
          <div className='text-left'>
            <div className='font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5'>
              <span>excalideck</span>
              <span className='text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-semibold'>
                v0.1.9
              </span>
            </div>
            <div className='text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5'>
              100% Free & Open Source under MIT License.
            </div>
          </div>
        </div>

        {/* Tactile Bottom Quick Actions Dock */}
        <div className='flex items-center gap-2'>
          
          <button
            onClick={handleConfettiShower}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs'
            title='Click for celebratory sparkles!'
          >
            <Sparkles className='w-3.5 h-3.5 text-indigo-500' />
            <span>Celebrate</span>
          </button>

          <a
            href='https://github.com/GokulAnand14/excalideck'
            target='_blank'
            rel='noopener noreferrer'
            onClick={() => sound.playPop()}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all shadow-xs'
          >
            <Github className='w-3.5 h-3.5' />
            <span>GitHub</span>
          </a>

          <button
            onClick={scrollToTop}
            aria-label='Scroll to top'
            className='p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs'
            title='Back to top'
          >
            <ArrowUp className='w-4 h-4' />
          </button>

        </div>

      </div>
    </footer>
  );
};
