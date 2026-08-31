import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroCanvas } from './components/HeroCanvas';
import { FeatureBento } from './components/FeatureBento';
import { BenchmarkComparison } from './components/BenchmarkComparison';
import { DownloadMatrix } from './components/DownloadMatrix';
import { Footer } from './components/Footer';
import { InteractiveCursor } from './components/InteractiveCursor';
import { CanvasScribbler } from './components/CanvasScribbler';
import { sound } from './utils/sound';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-zinc-900 dark:bg-[#0c0d0e] dark:text-zinc-100 antialiased transition-colors duration-200">
      {/* Free-Hand Live Whiteboard Scribble Layer */}
      <CanvasScribbler />

      {/* Anime.js Interactive Slime Cursor Follower */}
      <InteractiveCursor />

      {/* Minimalist Floating Header */}
      <Navbar
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Flow */}
      <main className="flex-1">
        <HeroCanvas />
        <FeatureBento />
        <BenchmarkComparison />
        <DownloadMatrix />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
