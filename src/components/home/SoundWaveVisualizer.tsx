import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SoundWaveVisualizerProps {
  isHovered: boolean;
}

export default function SoundWaveVisualizer({ isHovered }: SoundWaveVisualizerProps) {
  const [bars, setBars] = useState<number[]>(Array(24).fill(0.3));

  useEffect(() => {
    const generateBars = () => {
      return Array.from({ length: 24 }, () => 
        0.2 + Math.random() * (isHovered ? 0.8 : 0.5)
      );
    };

    setBars(generateBars());
    
    const interval = setInterval(() => {
      setBars(generateBars());
    }, isHovered ? 150 : 250);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Concentric rings */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute rounded-full border"
          style={{
            width: `${ring * 60 + 40}px`,
            height: `${ring * 60 + 40}px`,
            borderColor: isHovered ? 'rgba(34, 211, 238, 0.3)' : 'rgba(16, 185, 129, 0.15)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 3,
            delay: ring * 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Sound bars */}
      <div className="relative flex items-end justify-center gap-[3px] h-20 z-10">
        {bars.map((height, index) => {
          const isCenter = Math.abs(index - 12) < 6;
          const distanceFromCenter = Math.abs(index - 12);
          const baseOpacity = 1 - (distanceFromCenter * 0.08);
          
          return (
            <motion.div
              key={index}
              className="w-[6px] rounded-full"
              style={{
                background: isHovered 
                  ? `linear-gradient(to top, #10B981, #22D3EE)`
                  : `linear-gradient(to top, #10B981, #34D399)`,
                opacity: baseOpacity,
              }}
              animate={{ 
                height: `${height * (isHovered ? 80 : 60)}px`,
              }}
              transition={{ 
                duration: 0.15,
                ease: "easeOut"
              }}
            />
          );
        })}
      </div>

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(34, 211, 238, 0.15) 0%, transparent 70%)',
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}
