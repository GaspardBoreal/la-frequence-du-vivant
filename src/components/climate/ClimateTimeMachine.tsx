import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Thermometer, Droplets, Wind, Zap, AlertTriangle } from 'lucide-react';
import { ClimateProjection, TemporalVisualization } from '../../types/climate';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

interface ClimateTimeMachineProps {
  projections: ClimateProjection[];
  onYearChange: (year: number) => void;
  isLoading?: boolean;
}

const ClimateTimeMachine: React.FC<ClimateTimeMachineProps> = ({
  projections,
  onYearChange,
  isLoading = false
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const years = [2025, 2035, 2045];
  const currentProjection = projections[activeIndex];

  // Smooth year transition
  const handleYearChange = async (newIndex: number) => {
    if (newIndex === activeIndex || isTransitioning) return;
    
    setIsTransitioning(true);
    await new Promise(resolve => setTimeout(resolve, 600)); // Animation duration
    setActiveIndex(newIndex);
    onYearChange(years[newIndex]);
    setIsTransitioning(false);
  };

  // Auto-advance demo (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTransitioning) {
        const nextIndex = (activeIndex + 1) % years.length;
        handleYearChange(nextIndex);
      }
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, [activeIndex, isTransitioning]);

  if (isLoading || !currentProjection) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-blue-200 rounded-lg w-1/2 mx-auto"></div>
          <div className="h-32 bg-blue-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const getTemperatureColor = (change: number) => {
    if (change === 0) return 'text-blue-600';
    if (change < 2) return 'text-orange-500';
    return 'text-red-600';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 border-2 border-blue-200/50">
      {/* Header with Year Selector */}
      <div className="text-center mb-8">
        <motion.h2 
          className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text mb-4"
          key={currentProjection.year}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Climate Vision {currentProjection.year}
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

      {/* Climate Data Visualization */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentProjection.year}
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="space-y-6"
        >
          {/* Climate Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Temperature */}
            <motion.div 
              className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className={`h-5 w-5 ${getTemperatureColor(currentProjection.temperature.change)}`} />
                <span className="text-sm font-medium text-gray-700">Température</span>
              </div>
              <div className={`text-2xl font-bold ${getTemperatureColor(currentProjection.temperature.change)}`}>
                {currentProjection.temperature.avg.toFixed(1)}°C
              </div>
              {currentProjection.temperature.change !== 0 && (
                <div className={`text-sm font-medium ${getTemperatureColor(currentProjection.temperature.change)}`}>
                  +{currentProjection.temperature.change.toFixed(1)}°C
                </div>
              )}
            </motion.div>

            {/* Precipitation */}
            <motion.div 
              className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Précipitations</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(currentProjection.precipitation.total)}mm
              </div>
              {currentProjection.precipitation.change !== 0 && (
                <div className={`text-sm font-medium ${currentProjection.precipitation.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {currentProjection.precipitation.change > 0 ? '+' : ''}{currentProjection.precipitation.change}%
                </div>
              )}
            </motion.div>

            {/* Heat Days */}
            <motion.div 
              className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Jours &gt; 30°C</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {currentProjection.extremeEvents.heatDays}
              </div>
              <div className="text-xs text-gray-600">
                jours de canicule
              </div>
            </motion.div>

            {/* Drought Risk */}
            <motion.div 
              className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">Risque sécheresse</span>
              </div>
              <div className={`text-lg font-bold px-3 py-1 rounded-full ${getRiskColor(currentProjection.extremeEvents.droughtRisk)}`}>
                {currentProjection.extremeEvents.droughtRisk === 'low' && 'Faible'}
                {currentProjection.extremeEvents.droughtRisk === 'medium' && 'Moyen'}
                {currentProjection.extremeEvents.droughtRisk === 'high' && 'Élevé'}
              </div>
            </motion.div>
          </div>

          {/* Narrative Section */}
          <motion.div
            className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Récit climatique {currentProjection.year}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {currentProjection.year === 2025 && 
                "Aujourd'hui, le climat reste dans les normes historiques. Les écosystèmes locaux maintiennent leur équilibre traditionnel, avec des variations saisonnières prévisibles."
              }
              {currentProjection.year === 2035 && 
                "Une décennie de transformation s'annonce. Le réchauffement modifie les cycles naturels : floraisons précoces, migrations décalées, nouvelles espèces s'installent tandis que d'autres remontent vers le nord."
              }
              {currentProjection.year === 2045 && 
                "Le paysage sonore s'est métamorphosé. Les espèces méditerranéennes dominent désormais, créant une symphonie inédite. L'adaptation devient le maître-mot de la biodiversité locale."
              }
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ClimateTimeMachine;