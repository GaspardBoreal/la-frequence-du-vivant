
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Volume2, 
  BookOpen,
  Sparkles 
} from 'lucide-react';
import { Button } from './ui/button';
import { RegionalTheme } from '../utils/regionalThemes';

interface MultiSensoryNavigationProps {
  activeSection: 'visual' | 'audio' | 'poeme';
  onSectionChange: (section: 'visual' | 'audio' | 'poeme') => void;
  theme: RegionalTheme;
}

const MultiSensoryNavigation: React.FC<MultiSensoryNavigationProps> = ({
  activeSection,
  onSectionChange,
  theme
}) => {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const sections = [
    {
      id: 'visual' as const,
      label: 'Visuel',
      icon: Eye,
      color: theme.colors.primary,
      description: 'Explorez en images',
      angle: 0
    },
    {
      id: 'audio' as const,
      label: 'Audio',
      icon: Volume2,
      color: theme.colors.secondary,
      description: 'Écoutez les sons',
      angle: 120
    },
    {
      id: 'poeme' as const,
      label: 'Poème',
      icon: BookOpen,
      color: theme.colors.accent,
      description: 'Découvrez le poème',
      angle: 240
    }
  ];

  return (
    <div className="relative flex justify-center items-center py-16">
      {/* Central Hub */}
      <div className="relative">
        {/* Central Circle */}
        <motion.div
          className="w-32 h-32 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-2xl flex items-center justify-center relative z-10"
          animate={{
            rotate: activeSection === 'visual' ? 0 : activeSection === 'audio' ? 120 : 240
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <Sparkles className="h-8 w-8 text-purple-600" />
        </motion.div>

        {/* Orbital Sections */}
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const isHovered = hoveredSection === section.id;
          
          // Calculate position on circle
          const radius = 120;
          const radian = (section.angle * Math.PI) / 180;
          const x = Math.cos(radian) * radius;
          const y = Math.sin(radian) * radius;

          return (
            <motion.div
              key={section.id}
              className="absolute"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: section.angle / 360, duration: 0.5 }}
            >
              <Button
                variant={isActive ? "default" : "outline"}
                size="lg"
                onClick={() => onSectionChange(section.id)}
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
                className={`
                  relative w-20 h-20 rounded-full p-0 transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-110' 
                    : 'bg-white/80 backdrop-blur-sm hover:bg-white/90 text-gray-700 hover:scale-105'
                  }
                  ${isHovered ? 'shadow-xl' : ''}
                `}
              >
                <Icon className="h-6 w-6" />
                
                {/* Tooltip */}
                <motion.div
                  className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: isHovered ? 1 : 0,
                    y: isHovered ? 0 : 10
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {section.label}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black/80" />
                </motion.div>
              </Button>

              {/* Connection Lines */}
              <motion.div
                className="absolute top-1/2 left-1/2 origin-left h-0.5 bg-gradient-to-r from-purple-300 to-transparent"
                style={{
                  width: `${radius - 40}px`,
                  transform: `translate(-50%, -50%) rotate(${section.angle + 180}deg)`
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isActive ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>
          );
        })}

        {/* Particle Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full"
              style={{
                left: `${50 + Math.cos((i * 30 * Math.PI) / 180) * 80}%`,
                top: `${50 + Math.sin((i * 30 * Math.PI) / 180) * 80}%`
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiSensoryNavigation;
