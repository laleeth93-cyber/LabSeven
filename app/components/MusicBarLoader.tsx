// --- BLOCK app/components/MusicBarLoader.tsx OPEN ---
"use client";

import React from 'react';

interface MusicBarLoaderProps {
  text?: string;
  color?: string;
}

export default function MusicBarLoader({ 
  text = "Loading...", 
  color = "#9575cd" // Defaults to your brand purple
}: MusicBarLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full min-h-[120px]">
      <style>{`
        .music-bar {
          width: 5px;
          height: 28px;
          background-color: ${color};
          border-radius: 6px;
          animation: equalizer 1s ease-in-out infinite;
          transform-origin: bottom;
        }
        .music-bar:nth-child(1) { animation-delay: 0s; }
        .music-bar:nth-child(2) { animation-delay: 0.2s; }
        .music-bar:nth-child(3) { animation-delay: 0.4s; }
        .music-bar:nth-child(4) { animation-delay: 0.1s; }
        .music-bar:nth-child(5) { animation-delay: 0.3s; }
        
        @keyframes equalizer {
          0%, 100% { transform: scaleY(0.3); opacity: 0.6; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
      
      {/* The Animated Bars */}
      <div className="flex items-end gap-1.5 h-7">
        <div className="music-bar"></div>
        <div className="music-bar"></div>
        <div className="music-bar"></div>
        <div className="music-bar"></div>
        <div className="music-bar"></div>
      </div>

      {/* The Loading Text */}
      {text && (
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
// --- BLOCK app/components/MusicBarLoader.tsx CLOSE ---