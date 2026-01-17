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
  
  // Generate river path points
  const getPathPoint = (index: number, total: number) => {
    const progress = index / (total - 1);
    const x = 10 + progress * 80; // 10% to 90% width
    const y = 20 + Math.sin(progress * Math.PI * 2) * 8 + (index % 2) * 5; // Sinuous path
    return { x, y };
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 flex items-center justify-center gap-3">
            <Mountain className="h-8 w-8 text-amber-600" />
            Gradient biodiversité
            <Waves className="h-8 w-8 text-blue-500" />
          </h2>
          <p className="text-lg text-slate-600">
            De la source du Mont-Dore à l'estuaire de la Gironde
          </p>
        </motion.div>

        {/* River visualization */}
        <div className="relative h-[400px] md:h-[500px] overflow-hidden">
          {/* River background */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#065f46" />
                <stop offset="50%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#1e40af" />
              </linearGradient>
            </defs>
            
            {/* River path */}
            <path
              d={`M 5 ${25} Q 20 15 35 30 Q 50 45 65 25 Q 80 10 95 20`}
              fill="none"
              stroke="url(#riverGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.3"
            />
          </svg>

          {/* Source indicator */}
          <div className="absolute left-4 top-1/4 flex flex-col items-center">
            <Mountain className="h-10 w-10 text-amber-600 mb-2" />
            <span className="text-sm font-medium text-slate-600">Source</span>
            <span className="text-xs text-slate-500">Mont-Dore</span>
          </div>

          {/* Estuary indicator */}
          <div className="absolute right-4 top-1/4 flex flex-col items-center">
            <Waves className="h-10 w-10 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-slate-600">Estuaire</span>
            <span className="text-xs text-slate-500">Gironde</span>
          </div>

          {/* Stage bubbles */}
          {data.map((stage, index) => {
            const point = getPathPoint(index, data.length);
            const bubbleSize = 40 + (stage.speciesCount / maxSpecies) * 60; // 40-100px
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
                  className="relative rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg flex items-center justify-center"
                  style={{ width: bubbleSize, height: bubbleSize }}
                  animate={{ 
                    scale: isHovered ? 1.2 : 1,
                    boxShadow: isHovered ? '0 0 30px rgba(6, 182, 212, 0.5)' : '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                >
                  {/* Species count */}
                  <div className="text-center text-white">
                    <div className="font-bold text-lg md:text-xl">
                      {stage.speciesCount > 1000 ? `${(stage.speciesCount / 1000).toFixed(1)}k` : stage.speciesCount}
                    </div>
                    <div className="text-[8px] md:text-[10px] opacity-80">espèces</div>
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
                  <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-md">
                    <MapPin className="h-3 w-3 text-cyan-600" />
                    <span className="text-xs font-medium text-slate-700 max-w-[100px] truncate">
                      {stage.marcheName.split(' - ')[0]}
                    </span>
                  </div>
                </motion.div>

                {/* Order indicator */}
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center font-bold shadow">
                  {index + 1}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600" />
            <span className="text-sm text-slate-600">Taille = nombre d'espèces</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-slate-600">Sens d'écoulement →</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BiodiversityGradientRiver;
