import React from 'react';

interface Props {
  className?: string;
}

// Subtle animated SVG wave background for a bioacoustic vibe
const AudioWave: React.FC<Props> = ({ className }) => {
  return (
    <div className={"absolute inset-0 overflow-hidden pointer-events-none " + (className ?? "")}>      
      <svg
        className="absolute -top-10 left-0 w-[140%] h-[140%] opacity-30 animate-wave-slow"
        viewBox="0 0 800 600"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bio-waves" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--accent) / 0.5)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.4)" />
          </linearGradient>
        </defs>
        <g>
          <path
            d="M0,300 C150,260 250,340 400,300 C550,260 650,340 800,300 L800,600 L0,600 Z"
            fill="url(#bio-waves)"
          />
          <path
            className="opacity-60"
            d="M0,340 C160,300 240,380 400,340 C560,300 640,380 800,340 L800,600 L0,600 Z"
            fill="url(#bio-waves)"
          />
          <path
            className="opacity-40"
            d="M0,380 C170,340 230,420 400,380 C570,340 630,420 800,380 L800,600 L0,600 Z"
            fill="url(#bio-waves)"
          />
        </g>
      </svg>

      {/* floating particles */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-accent/70 animate-soft-pulse" />
        <div className="absolute bottom-16 right-16 w-2 h-2 rounded-full bg-accent/60 animate-gentle-float" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-primary/50 animate-gentle-float" />
      </div>
    </div>
  );
};

export default AudioWave;
