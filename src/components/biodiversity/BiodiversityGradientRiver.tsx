import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Droplets, Mountain, Waves } from 'lucide-react';

interface GradientData {
  marcheId: string;
  marcheName: string;
  speciesCount: number;
  order: number;
}

interface BiodiversityGradientRiverProps {
  data: GradientData[];
}

const BiodiversityGradientRiver: React.FC<BiodiversityGradientRiverProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate max for bubble sizing
  const maxSpecies = Math.max(...data.map(d => d.speciesCount), 1);
  
  // Generate river path points for desktop
  const getPathPoint = (index: number, total: number) => {
    const progress = index / (total - 1);
    const x = 10 + progress * 80;
    const y = 20 + Math.sin(progress * Math.PI * 2) * 8 + (index % 2) * 5;
    return { x, y };
  };

  return (
    <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Waves className="h-6 w-6 md:h-8 md:w-8 text-cyan-400" />
            Gradient biodiversité
            <Mountain className="h-6 w-6 md:h-8 md:w-8 text-amber-400" />
          </h2>
          <p className="text-base md:text-lg text-slate-400">
            De l'estuaire de la Gironde à la source du Mont-Dore
          </p>
        </motion.div>

        {/* Mobile/Tablet: Vertical Timeline */}
        <div className="md:hidden space-y-4">
          {/* Estuary indicator */}
          <div className="flex items-center gap-3 text-cyan-400 mb-6">
            <Waves className="h-8 w-8" />
            <div>
              <span className="font-medium">Estuaire</span>
              <span className="text-sm text-slate-500 block">Gironde</span>
            </div>
          </div>

          {data.map((stage, index) => {
            const bubbleSize = 50 + (stage.speciesCount / maxSpecies) * 30;
            
            return (
              <motion.div
                key={stage.marcheId}
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Order number */}
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-sm flex items-center justify-center font-bold flex-shrink-0">
                  {index + 1}
                </div>
                
                {/* Connection line */}
                <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 flex-shrink-0" />
                
                {/* Bubble */}
                <div 
                  className="rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20"
                  style={{ width: bubbleSize, height: bubbleSize }}
                >
                  <div className="text-center text-white">
                    <div className="font-bold text-sm">
                      {stage.speciesCount > 1000 ? `${(stage.speciesCount / 1000).toFixed(1)}k` : stage.speciesCount}
                    </div>
                  </div>
                </div>
                
                {/* Stage name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-white truncate">
                      {stage.marcheName.split(' - ')[0]}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{stage.speciesCount} espèces</span>
                </div>
              </motion.div>
            );
          })}

          {/* Source indicator */}
          <div className="flex items-center gap-3 text-amber-400 mt-6">
            <Mountain className="h-8 w-8" />
            <div>
              <span className="font-medium">Source</span>
              <span className="text-sm text-slate-500 block">Mont-Dore</span>
            </div>
          </div>
        </div>

        {/* Desktop: Horizontal River visualization */}
        <div className="hidden md:block relative h-[400px] lg:h-[500px] overflow-hidden">
          {/* River background */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            
            <path
              d={`M 5 ${25} Q 20 15 35 30 Q 50 45 65 25 Q 80 10 95 20`}
              fill="none"
              stroke="url(#riverGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.2"
            />
          </svg>

          {/* Estuary indicator (LEFT) */}
          <div className="absolute left-4 top-1/4 flex flex-col items-center">
            <Waves className="h-10 w-10 text-cyan-400 mb-2" />
            <span className="text-sm font-medium text-slate-300">Estuaire</span>
            <span className="text-xs text-slate-500">Gironde</span>
          </div>

          {/* Source indicator (RIGHT) */}
          <div className="absolute right-4 top-1/4 flex flex-col items-center">
            <Mountain className="h-10 w-10 text-amber-400 mb-2" />
            <span className="text-sm font-medium text-slate-300">Source</span>
            <span className="text-xs text-slate-500">Mont-Dore</span>
          </div>

          {/* Stage bubbles */}
          {data.map((stage, index) => {
            const point = getPathPoint(index, data.length);
            const bubbleSize = 40 + (stage.speciesCount / maxSpecies) * 60;
            const isHovered = hoveredIndex === index;
            
            return (
              <motion.div
                key={stage.marcheId}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{ 
                  left: `${point.x}%`, 
                  top: `${40 + point.y}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: 'spring' }}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
              >
                {/* Bubble */}
                <motion.div
                  className="relative rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/30 flex items-center justify-center"
                  style={{ width: bubbleSize, height: bubbleSize }}
                  animate={{ 
                    scale: isHovered ? 1.2 : 1,
                    boxShadow: isHovered ? '0 0 40px rgba(6, 182, 212, 0.6)' : '0 4px 20px rgba(6, 182, 212, 0.3)'
                  }}
                >
                  <div className="text-center text-white">
                    <div className="font-bold text-lg lg:text-xl">
                      {stage.speciesCount > 1000 ? `${(stage.speciesCount / 1000).toFixed(1)}k` : stage.speciesCount}
                    </div>
                    <div className="text-[8px] lg:text-[10px] opacity-80">espèces</div>
                  </div>

                  {/* Ripple effect on hover */}
                  {isHovered && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-cyan-300"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-cyan-300"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                      />
                    </>
                  )}
                </motion.div>

                {/* Stage label */}
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center"
                  style={{ top: bubbleSize + 8 }}
                  animate={{ opacity: isHovered ? 1 : 0.7 }}
                >
                  <div className="flex items-center gap-1 bg-slate-800/90 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-700">
                    <MapPin className="h-3 w-3 text-cyan-400" />
                    <span className="text-xs font-medium text-white max-w-[100px] truncate">
                      {stage.marcheName.split(' - ')[0]}
                    </span>
                  </div>
                </motion.div>

                {/* Order indicator */}
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold shadow border border-slate-700">
                  {index + 1}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mt-8 text-slate-400">
          <div className="flex items-center gap-2 justify-center">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600" />
            <span className="text-sm">Taille = nombre d'espèces</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Droplets className="h-5 w-5 text-cyan-400" />
            <span className="text-sm">Sens de remontée →</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BiodiversityGradientRiver;
