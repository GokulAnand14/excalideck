import React, { useEffect, useRef } from 'react';
import { Zap, Gauge } from 'lucide-react';
import { animate, stagger } from 'animejs';

export const BenchmarkComparison: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const words = ["Engineered", "for", "Native", "Speed."];

  useEffect(() => {
    if (!sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll('.bench-anim-card');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(cards, {
              translateY: [40, 0],
              opacity: [0, 1],
              scale: [0.94, 1],
              delay: stagger(100),
              duration: 750,
              ease: 'outBack(1.5)',
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCardHover = (e: React.MouseEvent<HTMLDivElement>) => {
    animate(e.currentTarget, {
      scaleX: [1, 1.04, 0.98, 1],
      scaleY: [1, 0.96, 1.02, 1],
      duration: 450,
      ease: 'outElastic(1.2, .4)',
    });
  };

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

  const metrics = [
    {
      title: 'RAM Usage (Idle)',
      excalideck: '32 MB',
      electron: '380 MB',
      browser: '240 MB',
      advantage: '11.8x lighter on RAM',
    },
    {
      title: 'File Switching Latency',
      excalideck: '0 ms (In-Memory)',
      electron: '450 ms (Flicker)',
      browser: 'Manual upload',
      advantage: 'Instant 0ms scene hydration',
    },
    {
      title: 'Disk Write & Auto-Save',
      excalideck: 'Atomic Rust I/O',
      electron: 'JS File System',
      browser: 'Volatile Storage',
      advantage: 'Zero corruption guarantee',
    },
    {
      title: 'Git Version Control',
      excalideck: 'Decoupled .assets/ (Clean)',
      electron: 'Base64 Bloat',
      browser: 'Manual export',
      advantage: 'Clean human-readable diffs',
    },
  ];

  return (
    <section ref={sectionRef} id="benchmarks" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto select-none">
      <div className="text-center max-w-3xl mx-auto mb-14 relative">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 mb-3 shadow-xs">
          <Gauge className="w-3.5 h-3.5" />
          <span>RUST & TAURI V2 BENCHMARKS</span>
        </div>
        
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex flex-wrap items-center justify-center gap-x-3 gap-y-2 cursor-pointer">
          {words.map((word, wIdx) => (
            <span key={wIdx} className="inline-block whitespace-nowrap">
              {word.split('').map((char, cIdx) => (
                <span
                  key={cIdx}
                  onMouseEnter={(e) => handleLetterHover(e, wIdx * 10 + cIdx)}
                  className="inline-block transition-colors duration-200 hover:text-emerald-500"
                >
                  {char}
                </span>
              ))}
            </span>
          ))}
        </h2>

        <div className="w-40 h-3 mx-auto mt-2 text-emerald-500/60">
          <svg viewBox="0 0 160 12" className="w-full h-full fill-none stroke-current stroke-[2.5]" strokeLinecap="round">
            <path d="M 5 6 Q 80 1, 155 6" />
          </svg>
        </div>

        <p className="text-zinc-600 dark:text-zinc-400 mt-3 text-base">
          See how Excalideck compares to bloated Electron wrappers and browser tabs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, i) => (
          <div
            key={i}
            onMouseEnter={handleCardHover}
            className="bench-anim-card p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl mac-window-shadow flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-emerald-500/10 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {m.title}
              </span>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono group-hover:text-emerald-500 transition-colors">
                  {m.excalideck}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Excalideck
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Electron:</span>
                  <span className="font-mono text-rose-500 dark:text-rose-400">{m.electron}</span>
                </div>
                <div className="flex justify-between">
                  <span>Browser:</span>
                  <span className="font-mono">{m.browser}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
              <Zap className="w-3.5 h-3.5" />
              <span>{m.advantage}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
