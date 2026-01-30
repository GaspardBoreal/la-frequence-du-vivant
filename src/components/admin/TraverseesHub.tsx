import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, List } from 'lucide-react';
import type { TexteExport } from '@/utils/epubExportUtils';
import PoeticSeismograph from './PoeticSeismograph';
import LivingIndex from './LivingIndex';

interface TraverseesHubProps {
  textes: TexteExport[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

type TraverseeMode = 'seismograph' | 'living-index';

const modes: { id: TraverseeMode; label: string; icon: React.ElementType }[] = [
  { id: 'seismograph', label: 'Sismographe Poétique', icon: Activity },
  { id: 'living-index', label: 'Index Vivant', icon: List },
];

const TraverseesHub: React.FC<TraverseesHubProps> = ({ textes, colorScheme }) => {
  const [activeMode, setActiveMode] = useState<TraverseeMode>('seismograph');

  return (
    <div 
      className="h-[400px] flex flex-col"
      style={{ backgroundColor: colorScheme.background }}
    >
      {/* Mode Selector */}
      <div 
        className="flex items-center justify-center gap-1 px-4 py-3 border-b"
        style={{ borderColor: colorScheme.secondary + '20' }}
      >
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className="relative px-4 py-1.5 text-xs tracking-wide transition-all duration-300 rounded-sm"
              style={{
                color: isActive ? colorScheme.primary : colorScheme.secondary,
                fontWeight: isActive ? 500 : 400,
              }}
            >
              <span className="flex items-center gap-1.5">
                <Icon className="h-3 w-3" />
                {mode.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="traversee-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ backgroundColor: colorScheme.accent }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeMode === 'seismograph' && (
              <PoeticSeismograph textes={textes} colorScheme={colorScheme} />
            )}
            {activeMode === 'living-index' && (
              <LivingIndex textes={textes} colorScheme={colorScheme} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TraverseesHub;
