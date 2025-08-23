import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface EcoAudioVisualizerProps {
  isPlaying: boolean;
  currentTime?: number;
  duration?: number;
  className?: string;
}

export default function EcoAudioVisualizer({ 
  isPlaying, 
  currentTime = 0, 
  duration = 1,
  className = ""
}: EcoAudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    // Generate random heights for visualization bars
    const generateBars = () => {
      return Array.from({ length: 20 }, () => Math.random());
    };

    setBars(generateBars());

    if (isPlaying) {
      const interval = setInterval(() => {
        setBars(generateBars());
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentTime]);

  const progressRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <div className={`flex items-end justify-center space-x-1 h-16 ${className}`}>
      {bars.map((height, index) => {
        const isActive = index / bars.length <= progressRatio;
        const barHeight = isPlaying ? height * 100 : 20;
        
        return (
          <motion.div
            key={index}
            className={`w-2 rounded-t-sm dordogne-experience eco-audio-wave ${
              isActive ? 'opacity-100' : 'opacity-30'
            }`}
            initial={{ scaleY: 0.2 }}
            animate={{ 
              scaleY: isPlaying ? height * 0.8 + 0.2 : 0.2,
              opacity: isActive ? 1 : 0.3
            }}
            transition={{ 
              duration: 0.15, 
              ease: "easeInOut",
              delay: index * 0.02 
            }}
            style={{ 
              height: `${Math.max(barHeight, 8)}%`,
              transformOrigin: 'bottom'
            }}
          />
        );
      })}
    </div>
  );
}