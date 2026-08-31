import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';

export const FloatingMagicDoodles: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Anime.js floating loops with irregular sine waves & rotations
    const doodles = containerRef.current.querySelectorAll('.magic-doodle');
    doodles.forEach((el, index) => {
      animate(el, {
        translateY: [
          { value: -24 - (index * 4), duration: 2400 + (index * 300), ease: 'inOutSine' },
          { value: 24 + (index * 4), duration: 2800 + (index * 300), ease: 'inOutSine' },
        ],
        translateX: [
          { value: 16, duration: 3200 + (index * 400), ease: 'inOutQuad' },
          { value: -16, duration: 3000 + (index * 400), ease: 'inOutQuad' },
        ],
        rotate: [
          { value: (index % 2 === 0 ? 12 : -12), duration: 3600, ease: 'inOutSine' },
          { value: (index % 2 === 0 ? -12 : 12), duration: 3600, ease: 'inOutSine' },
        ],
        loop: true,
        alternate: true,
      });
    });
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      
      {/* 1. Top Left Sketch Rectangle */}
      <svg className="magic-doodle absolute left-[10%] top-[18%] w-24 h-16 text-indigo-500/50 stroke-current fill-none stroke-[2]" viewBox="0 0 100 60">
        <rect x="5" y="5" width="90" height="50" rx="8" strokeDasharray="300" strokeDashoffset="0" />
      </svg>

      {/* 2. Top Right Sketch Diamond (Decision Node) */}
      <svg className="magic-doodle absolute right-[12%] top-[16%] w-20 h-20 text-purple-500/50 stroke-current fill-none stroke-[2]" viewBox="0 0 80 80">
        <path d="M40 5 L75 40 L40 75 L5 40 Z" />
      </svg>

      {/* 3. Mid Left Looping Arrow */}
      <svg className="magic-doodle absolute left-[6%] top-[55%] w-28 h-20 text-emerald-500/50 stroke-current fill-none stroke-[2.2]" viewBox="0 0 120 70">
        <path d="M10 50 Q 50 10, 100 45" />
        <polyline points="90,40 100,45 92,55" fill="currentColor" />
      </svg>

      {/* 4. Mid Right Sketch Ellipse */}
      <svg className="magic-doodle absolute right-[8%] top-[52%] w-24 h-24 text-amber-500/50 stroke-current fill-none stroke-[2]" viewBox="0 0 80 80">
        <ellipse cx="40" cy="40" rx="35" ry="25" />
      </svg>

      {/* 5. Bottom Left Squiggle */}
      <svg className="magic-doodle absolute left-[18%] bottom-[12%] w-32 h-12 text-cyan-500/40 stroke-current fill-none stroke-[2.5]" viewBox="0 0 120 40">
        <path d="M5 20 Q 30 5, 60 20 T 115 20" />
      </svg>

      {/* 6. Bottom Right Star / Sparkle */}
      <svg className="magic-doodle absolute right-[18%] bottom-[14%] w-16 h-16 text-rose-500/40 stroke-current fill-none stroke-[2]" viewBox="0 0 60 60">
        <path d="M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z" />
      </svg>

    </div>
  );
};
