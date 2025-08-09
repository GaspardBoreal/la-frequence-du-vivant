import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface BiodiversityMetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  delay?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export const BiodiversityMetricCard: React.FC<BiodiversityMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
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
        gaspard-glass p-3 rounded-xl border transition-all duration-300 ease-out
        backdrop-blur-md relative overflow-hidden
        ${isSelected 
          ? `border-${color}/60 bg-${color}/20 shadow-xl shadow-${color}/30` 
          : `border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 hover:shadow-2xl hover:shadow-${color}/20`
        }
      `}>
        {/* Gradient overlay */}
        <div className={`
          absolute inset-0 bg-gradient-to-br from-${color}/10 to-${color}/5
          transition-opacity duration-300 rounded-xl
          ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `} />
        
        {/* Selection indicator */}
        {isSelected && (
          <div className={`
            absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-${color} rounded-full
            border-2 border-white shadow-lg
          `} />
        )}
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          <div className={`
            p-2 rounded-lg border transition-all duration-300
            ${isSelected 
              ? `bg-${color}/30 border-${color}/50` 
              : `bg-${color}/10 border-${color}/20 group-hover:bg-${color}/20 group-hover:border-${color}/30`
            }
          `}>
            <Icon className={`w-4 h-4 text-${color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`
              text-xs font-medium transition-colors truncate
              ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
            `}>
              {title}
            </h3>
            <div className={`
              text-xl font-bold text-${color} transition-colors
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
          rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
          blur-sm -z-10
        `} />
      </div>
    </motion.div>
  );
};