import React from 'react';

interface DecorativeParticlesProps {
  className?: string;
}

const DecorativeParticles: React.FC<DecorativeParticlesProps> = ({ className }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Particules flottantes organiques */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gaspard-primary/20 rounded-full animate-gentle-float animation-delay-0"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-gaspard-secondary/30 rounded-full animate-gentle-float animation-delay-1000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-gaspard-accent/15 rounded-full animate-gentle-float animation-delay-2000"></div>
      <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-gaspard-primary/25 rounded-full animate-gentle-float animation-delay-1500"></div>
      <div className="absolute bottom-1/3 right-1/2 w-2.5 h-2.5 bg-gaspard-secondary/20 rounded-full animate-gentle-float animation-delay-500"></div>
      
      {/* Formes organiques en arrière-plan */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path 
          d="M20,30 Q40,10 60,30 T80,40 Q70,60 50,50 T20,30" 
          fill="url(#organicGradient1)" 
          className="animate-soft-pulse"
        />
        <path 
          d="M10,70 Q30,50 50,70 T90,80 Q80,90 60,85 T10,70" 
          fill="url(#organicGradient2)" 
          className="animate-soft-pulse animation-delay-1000"
        />
        <defs>
          <linearGradient id="organicGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--gaspard-primary))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(var(--gaspard-accent))" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="organicGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--gaspard-secondary))" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(var(--gaspard-primary))" stopOpacity="0.03" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default DecorativeParticles;