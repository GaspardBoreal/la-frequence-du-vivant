import React from 'react';
import { cn } from '@/lib/utils';

interface MediaSkeletonGridProps {
  count?: number;
  mode?: 'immersion' | 'fiche';
  className?: string;
}

const MediaSkeletonGrid: React.FC<MediaSkeletonGridProps> = ({ count = 6, mode = 'immersion', className }) => {
  return (
    <div className={cn(
      'grid',
      mode === 'immersion' ? 'grid-cols-3 gap-1' : 'grid-cols-2 gap-2',
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'relative overflow-hidden rounded-lg',
            mode === 'immersion' ? 'aspect-[3/4]' : 'aspect-square'
          )}
        >
          {/* Base */}
          <div className="absolute inset-0 bg-emerald-950/40" />
          {/* Shimmer */}
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              background: 'linear-gradient(135deg, transparent 30%, hsl(140 25% 20% / 0.5) 50%, transparent 70%)',
              backgroundSize: '200% 200%',
              animation: `shimmer ${1.5 + i * 0.15}s ease-in-out infinite`,
            }}
          />
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-emerald-400/5" />
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default MediaSkeletonGrid;
