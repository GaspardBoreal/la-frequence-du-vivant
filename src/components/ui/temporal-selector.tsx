import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Button } from './button';
import { Slider } from './slider';

interface TemporalSelectorProps {
  activeYear: number;
  onYearChange: (year: number) => void;
  isTransitioning?: boolean;
  title?: string;
}

const TemporalSelector: React.FC<TemporalSelectorProps> = ({
  activeYear,
  onYearChange,
  isTransitioning = false,
  title = "Vision Temporelle"
}) => {
  const years = [2025, 2035, 2045];
  const activeIndex = years.indexOf(activeYear);

  const handleYearChange = (newIndex: number) => {
    if (newIndex === activeIndex || isTransitioning) return;
    onYearChange(years[newIndex]);
  };

  return (
    <div className="text-center mb-8">
      <motion.h2 
        className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text mb-4"
        key={activeYear}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {title} {activeYear}
      </motion.h2>
      
      {/* Temporal Navigation */}
      <div className="flex justify-center items-center gap-4 mb-6">
        {years.map((year, index) => (
          <Button
            key={year}
            variant={index === activeIndex ? 'default' : 'outline'}
            size="lg"
            onClick={() => handleYearChange(index)}
            disabled={isTransitioning}
            className={`
              relative transition-all duration-300
              ${index === activeIndex 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110' 
                : 'bg-white/80 hover:bg-white text-blue-700 hover:scale-105'
              }
            `}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {year}
            {index === activeIndex && (
              <motion.div
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full"
                layoutId="activeIndicator"
              />
            )}
          </Button>
        ))}
      </div>

      {/* Progress Timeline */}
      <div className="w-full max-w-md mx-auto">
        <Slider
          value={[activeIndex]}
          onValueChange={([value]) => handleYearChange(value)}
          max={2}
          step={1}
          className="w-full"
          disabled={isTransitioning}
        />
        <div className="flex justify-between text-xs text-blue-600 mt-1">
          <span>Présent</span>
          <span>Proche</span>
          <span>Lointain</span>
        </div>
      </div>
    </div>
  );
};

export default TemporalSelector;