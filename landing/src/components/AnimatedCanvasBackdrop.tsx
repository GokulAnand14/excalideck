import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { sound } from '../utils/sound';

export const AnimatedCanvasBackdrop: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Anime.js Background Morphing Blobs
    if (blob1Ref.current) {
      animate(blob1Ref.current, {
        translateX: [
          { value: 60, duration: 6000, ease: 'inOutSine' },
          { value: -40, duration: 7000, ease: 'inOutSine' },
        ],
        translateY: [
          { value: -50, duration: 5500, ease: 'inOutSine' },
          { value: 40, duration: 6500, ease: 'inOutSine' },
        ],
        scale: [
          { value: 1.15, duration: 6000, ease: 'inOutQuad' },
          { value: 0.9, duration: 6000, ease: 'inOutQuad' },
        ],
        loop: true,
        alternate: true,
      });
    }

    if (blob2Ref.current) {
      animate(blob2Ref.current, {
        translateX: [
          { value: -70, duration: 7000, ease: 'inOutSine' },
          { value: 50, duration: 6500, ease: 'inOutSine' },
        ],
        translateY: [
          { value: 60, duration: 6000, ease: 'inOutSine' },
          { value: -40, duration: 7500, ease: 'inOutSine' },
        ],
        scale: [
          { value: 0.85, duration: 7000, ease: 'inOutQuad' },
          { value: 1.2, duration: 7000, ease: 'inOutQuad' },
        ],
        loop: true,
        alternate: true,
      });
    }

    if (blob3Ref.current) {
      animate(blob3Ref.current, {
        translateX: [
          { value: 40, duration: 8000, ease: 'inOutSine' },
          { value: -60, duration: 8000, ease: 'inOutSine' },
        ],
        translateY: [
          { value: 40, duration: 7500, ease: 'inOutSine' },
          { value: -50, duration: 7000, ease: 'inOutSine' },
        ],
        scale: [
          { value: 1.1, duration: 8000, ease: 'inOutQuad' },
          { value: 0.95, duration: 8000, ease: 'inOutQuad' },
        ],
        loop: true,
        alternate: true,
      });
    }

    // 2. Floating Doodles Loop
    if (containerRef.current) {
      const doodles = containerRef.current.querySelectorAll('.sketch-doodle');
      doodles.forEach((el, index) => {
        animate(el, {
          translateY: [
            { value: -16 - (index * 2), duration: 2800 + (index * 350), ease: 'inOutSine' },
            { value: 16 + (index * 2), duration: 3200 + (index * 350), ease: 'inOutSine' },
          ],
          rotate: [
            { value: (index % 2 === 0 ? 6 : -6), duration: 4200 + (index * 250), ease: 'inOutSine' },
            { value: (index % 2 === 0 ? -6 : 6), duration: 4200 + (index * 250), ease: 'inOutSine' },
          ],
          loop: true,
          alternate: true,
        });
      });
    }
  }, []);

  const handleDoodleClick = (e: React.MouseEvent<HTMLDivElement>, freq = 500) => {
    sound.playSlimeSquish(freq);
    animate(e.currentTarget, {
      scaleX: [1, 1.35, 0.85, 1.1, 1],
      scaleY: [1, 0.7, 1.25, 0.95, 1],
      rotate: [0, 15, -15, 0],
      duration: 650,
      ease: 'outElastic(1.2, .4)',
    });
  };

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      
      {/* Morphing Gradient Blobs */}
      <div
        ref={blob1Ref}
        className="absolute left-[15%] top-[12%] w-[450px] h-[450px] rounded-full bg-indigo-500/12 dark:bg-indigo-500/18 blur-[110px] -z-10"
      />
      <div
        ref={blob2Ref}
        className="absolute right-[12%] top-[25%] w-[420px] h-[420px] rounded-full bg-purple-500/10 dark:bg-purple-500/16 blur-[120px] -z-10"
      />
      <div
        ref={blob3Ref}
        className="absolute left-[35%] bottom-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/8 dark:bg-emerald-500/14 blur-[130px] -z-10"
      />

      {/* Interactive Excalidraw Style Hand-Drawn Doodles */}
      
      {/* Doodle 1: Hand-Drawn Sketch Box (Top Left) */}
      <div
        onClick={(e) => handleDoodleClick(e, 480)}
        className="sketch-doodle pointer-events-auto absolute left-[7%] top-[16%] opacity-70 hover:opacity-100 transition-opacity cursor-pointer hidden lg:block"
        title="Click to squish sketch box"
      >
        <svg className="w-28 h-20 text-indigo-500 dark:text-indigo-400 stroke-current fill-none stroke-[2]" viewBox="0 0 120 80">
          <path d="M 8 12 Q 55 8, 110 10 Q 112 40, 108 70 Q 60 74, 10 68 Q 6 38, 8 12" strokeLinecap="round" />
          <path d="M 12 15 Q 58 13, 106 14 Q 107 42, 104 66 Q 58 69, 14 65 Q 11 40, 12 15" strokeLinecap="round" strokeDasharray="3 3" opacity="0.6" />
          <text x="24" y="44" className="text-[12px] font-mono fill-current stroke-none font-bold">
            0ms RAM
          </text>
        </svg>
      </div>

      {/* Doodle 2: Decision Diamond (Top Right) */}
      <div
        onClick={(e) => handleDoodleClick(e, 560)}
        className="sketch-doodle pointer-events-auto absolute right-[8%] top-[15%] opacity-70 hover:opacity-100 transition-opacity cursor-pointer hidden lg:block"
        title="Click to squish decision diamond"
      >
        <svg className="w-24 h-24 text-purple-500 dark:text-purple-400 stroke-current fill-none stroke-[2]" viewBox="0 0 100 100">
          <path d="M 50 8 Q 72 28, 92 50 Q 70 72, 50 92 Q 28 70, 8 50 Q 30 28, 50 8" strokeLinecap="round" />
          <path d="M 52 12 Q 70 30, 88 50 Q 68 70, 50 88 Q 30 68, 12 50 Q 32 30, 52 12" strokeLinecap="round" opacity="0.5" />
          <line x1="38" y1="42" x2="62" y2="42" strokeLinecap="round" />
          <line x1="34" y1="50" x2="66" y2="50" strokeLinecap="round" />
          <line x1="42" y1="58" x2="58" y2="58" strokeLinecap="round" />
        </svg>
      </div>

      {/* Doodle 3: Curved Sync Arrow (Mid Left) */}
      <div
        onClick={(e) => handleDoodleClick(e, 620)}
        className="sketch-doodle pointer-events-auto absolute left-[5%] top-[54%] opacity-70 hover:opacity-100 transition-opacity cursor-pointer hidden lg:block"
        title="Click to sync arrow"
      >
        <svg className="w-32 h-24 text-emerald-500 dark:text-emerald-400 stroke-current fill-none stroke-[2.2]" viewBox="0 0 140 100">
          <path
            d="M 15 75 Q 60 15, 120 50"
            strokeLinecap="round"
          />
          <path d="M 108 42 L 122 51 L 112 62" strokeLinecap="round" strokeLinejoin="round" />
          <text x="35" y="86" className="text-[10px] font-mono fill-current stroke-none font-semibold">
            sync to disk
          </text>
        </svg>
      </div>

      {/* Doodle 4: Zero Cloud Doodle (Mid Right) */}
      <div
        onClick={(e) => handleDoodleClick(e, 440)}
        className="sketch-doodle pointer-events-auto absolute right-[6%] top-[52%] opacity-70 hover:opacity-100 transition-opacity cursor-pointer hidden lg:block"
        title="Click zero cloud"
      >
        <svg className="w-32 h-20 text-cyan-500 dark:text-cyan-400 stroke-current fill-none stroke-[2]" viewBox="0 0 140 80">
          <path d="M 30 55 C 15 55, 10 40, 25 30 C 22 15, 45 10, 60 20 C 72 8, 98 12, 105 25 C 122 20, 132 38, 120 55 Z" strokeLinecap="round" />
          <line x1="20" y1="20" x2="125" y2="60" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
          <text x="45" y="72" className="text-[10px] font-mono fill-rose-500 stroke-none font-bold">
            ZERO CLOUD
          </text>
        </svg>
      </div>

      {/* Doodle 5: Database Cylinder (Bottom Left) */}
      <div
        onClick={(e) => handleDoodleClick(e, 520)}
        className="sketch-doodle pointer-events-auto absolute left-[14%] bottom-[12%] opacity-65 hover:opacity-100 transition-opacity cursor-pointer hidden lg:block"
        title="Click vault database"
      >
        <svg className="w-24 h-24 text-amber-500 dark:text-amber-400 stroke-current fill-none stroke-[2]" viewBox="0 0 100 100">
          <ellipse cx="50" cy="25" rx="35" ry="12" strokeLinecap="round" />
          <path d="M 15 25 L 15 70 Q 50 85, 85 70 L 85 25" strokeLinecap="round" />
          <path d="M 15 48 Q 50 62, 85 48" strokeLinecap="round" strokeDasharray="3 3" />
          <text x="28" y="60" className="text-[10.5px] font-mono fill-current stroke-none font-bold">
            .vault
          </text>
        </svg>
      </div>

      {/* Doodle 6: Sparkle Stars (Bottom Right) */}
      <div
        onClick={(e) => handleDoodleClick(e, 720)}
        className="sketch-doodle pointer-events-auto absolute right-[15%] bottom-[14%] opacity-65 hover:opacity-100 transition-opacity cursor-pointer hidden lg:block"
        title="Click star sparkle"
      >
        <svg className="w-20 h-20 text-rose-500 dark:text-rose-400 stroke-current fill-none stroke-[2]" viewBox="0 0 80 80">
          <path d="M 40 10 Q 40 40, 70 40 Q 40 40, 40 70 Q 40 40, 10 40 Q 40 40, 40 10" strokeLinecap="round" />
          <circle cx="20" cy="20" r="2" fill="currentColor" />
          <circle cx="65" cy="60" r="3" fill="currentColor" />
        </svg>
      </div>

    </div>
  );
};
