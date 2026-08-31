import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';

export const InteractiveCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailContainerRef = useRef<HTMLDivElement>(null);
  const [cursorMode, setCursorMode] = useState<'default' | 'click' | 'drag' | 'slime'>('default');
  const [cursorText, setCursorText] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const mouse = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const angle = useRef(0);
  const speed = useRef(0);
  const isSpeedy = useRef(false);
  const lastSpawnTime = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    setIsVisible(true);

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - mouse.current.x;
      const dy = e.clientY - mouse.current.y;
      const currentSpeed = Math.sqrt(dx * dx + dy * dy);
      speed.current = Math.min(currentSpeed, 50);
      angle.current = Math.atan2(dy, dx) * (180 / Math.PI);

      mouse.current = { x: e.clientX, y: e.clientY };

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Acceleration Check: When speed exceeds threshold, trigger slime state everywhere!
      const highVelocity = speed.current > 14;
      isSpeedy.current = highVelocity;

      // Check hover targets
      const target = e.target as HTMLElement | null;
      const isLetter = target?.closest('.hero-letter');
      const clickable = target?.closest('button, a, input');
      const draggable = target?.closest('.sticker, [data-id], [data-window-id]');

      if (highVelocity || isLetter) {
        setCursorMode('slime');
        setCursorText(isLetter ? '~ SLIME ~' : '');
        
        // Spawn trailing slime droplets when accelerating
        const now = Date.now();
        if (now - lastSpawnTime.current > 45 && trailContainerRef.current) {
          lastSpawnTime.current = now;
          spawnSlimeDroplet(e.clientX, e.clientY, speed.current);
        }
      } else if (draggable) {
        setCursorMode('drag');
        setCursorText('DRAG');
      } else if (clickable) {
        setCursorMode('click');
        setCursorText('CLICK');
      } else {
        setCursorMode('default');
        setCursorText('');
      }
    };

    const spawnSlimeDroplet = (x: number, y: number, velocity: number) => {
      if (!trailContainerRef.current) return;
      const drop = document.createElement('div');
      const size = Math.min(Math.max(velocity * 0.35, 4), 10);
      drop.className = 'pointer-events-none fixed rounded-full bg-gradient-to-tr from-indigo-500/80 via-purple-500/80 to-pink-500/80 shadow-sm';
      drop.style.width = `${size}px`;
      drop.style.height = `${size}px`;
      drop.style.left = `${x - size / 2}px`;
      drop.style.top = `${y - size / 2}px`;
      trailContainerRef.current.appendChild(drop);

      animate(drop, {
        scale: [1, 0],
        opacity: [0.8, 0],
        translateY: [(Math.random() - 0.5) * 20],
        translateX: [(Math.random() - 0.5) * 20],
        duration: 400 + Math.random() * 200,
        ease: 'outQuad',
        onComplete: () => {
          if (drop.parentNode) {
            drop.parentNode.removeChild(drop);
          }
        },
      });
    };

    const onMouseDown = () => {
      if (ringRef.current) {
        animate(ringRef.current, {
          scale: [1, 0.7, 1.25, 1],
          duration: 350,
          ease: 'outElastic(1, .4)',
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);

    // Liquid Lerp physics loop with velocity stretching
    let rafId: number;
    const updateRing = () => {
      ringPos.current.x += (mouse.current.x - ringPos.current.x) * 0.24;
      ringPos.current.y += (mouse.current.y - ringPos.current.y) * 0.24;

      if (ringRef.current) {
        if (cursorMode === 'slime' || isSpeedy.current) {
          // Dynamic liquid slime squish & stretch aligned with travel angle
          const stretchX = 1 + (speed.current * 0.032);
          const stretchY = Math.max(0.55, 1 - (speed.current * 0.024));
          ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) rotate(${angle.current}deg) scale(${stretchX}, ${stretchY})`;
        } else {
          ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
        }
      }

      // Smooth decay of velocity
      speed.current *= 0.92;
      if (speed.current < 2 && cursorMode === 'slime' && !isSpeedy.current) {
        setCursorMode('default');
      }

      rafId = requestAnimationFrame(updateRing);
    };
    rafId = requestAnimationFrame(updateRing);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      cancelAnimationFrame(rafId);
    };
  }, [cursorMode]);

  if (!isVisible) return null;

  return (
    <>
      {/* Container for trailing slime droplets */}
      <div ref={trailContainerRef} className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden select-none" />

      {/* Main Cursor Elements */}
      <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none">
        {/* Inner Pin Dot */}
        <div
          ref={dotRef}
          className={`absolute top-0 left-0 -ml-1 -mt-1 rounded-full transition-all duration-150 ${
            cursorMode === 'slime'
              ? 'w-3 h-3 -ml-1.5 -mt-1.5 bg-gradient-to-r from-pink-500 via-indigo-500 to-emerald-400 shadow-md shadow-indigo-500/50 animate-pulse'
              : 'w-2 h-2 bg-indigo-500'
          }`}
        />

        {/* Slimy Morphing Liquid Cursor Ring with Velocity Deformation */}
        <div
          ref={ringRef}
          className={`absolute top-0 left-0 flex items-center justify-center transition-[width,height,margin,background-color,border-radius] duration-150 ${
            cursorMode === 'slime'
              ? '-ml-7 -mt-7 w-14 h-14 rounded-[42%_58%_68%_32%/52%_48%_52%_48%] bg-gradient-to-br from-indigo-500/35 via-purple-500/30 to-pink-500/35 border-2 border-indigo-400 backdrop-blur-xs shadow-xl shadow-indigo-500/35'
              : cursorMode === 'click' || cursorMode === 'drag'
              ? '-ml-6 -mt-6 w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500 shadow-lg shadow-indigo-500/20'
              : '-ml-4 -mt-4 w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/60'
          }`}
        >
          {cursorText && (
            <span className="text-[8.5px] font-mono font-black tracking-wider text-indigo-600 dark:text-indigo-300 drop-shadow-xs">
              {cursorText}
            </span>
          )}
        </div>
      </div>
    </>
  );
};
