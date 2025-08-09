import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { SourceTooltip } from './SourceTooltip';

interface BiodiversityMetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  source: string;
  sourceUrl?: string;
  delay?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export const BiodiversityMetricCard: React.FC<BiodiversityMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  source,
  sourceUrl,
  delay = 0,
  isSelected = false,
  onClick
}) => {
  const animatedValue = useAnimatedCounter(value, 1000, delay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={`group relative ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className={`
        gaspard-glass p-6 rounded-2xl border transition-all duration-300 ease-out
        backdrop-blur-md relative overflow-hidden
        ${isSelected 
          ? `border-${color}/60 bg-${color}/20 shadow-xl shadow-${color}/30` 
          : `border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 hover:shadow-2xl hover:shadow-${color}/20`
        }
      `}>
        {/* Gradient overlay */}
        <div className={`
          absolute inset-0 bg-gradient-to-br from-${color}/10 to-${color}/5
          transition-opacity duration-300 rounded-2xl
          ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `} />
        
        {/* Selection indicator */}
        {isSelected && (
          <div className={`
            absolute top-2 right-2 w-3 h-3 bg-${color} rounded-full
            border-2 border-white shadow-lg
          `} />
        )}
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={`
              p-3 rounded-xl border transition-all duration-300
              ${isSelected 
                ? `bg-${color}/30 border-${color}/50` 
                : `bg-${color}/10 border-${color}/20 group-hover:bg-${color}/20 group-hover:border-${color}/30`
              }
            `}>
              <Icon className={`w-6 h-6 text-${color}`} />
            </div>
            <SourceTooltip source={source} url={sourceUrl} />
          </div>
          
          <div className="space-y-2">
            <h3 className={`
              text-sm font-medium transition-colors
              ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
            `}>
              {title}
            </h3>
            <div className={`
              text-3xl font-bold text-${color} transition-colors
              font-mono tabular-nums
              ${isSelected ? `brightness-110` : ''}
            `}>
              {animatedValue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Subtle glow effect */}
        <div className={`
          absolute -inset-0.5 bg-gradient-to-r from-${color}/20 to-${color}/10
          rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
          blur-sm -z-10
        `} />
      </div>
    </motion.div>
  );
};