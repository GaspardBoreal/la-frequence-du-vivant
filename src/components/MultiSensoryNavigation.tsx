
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

  const handleSectionClick = (sectionId: 'visual' | 'audio' | 'poeme') => {
    console.log(`🔧 DEBUG: Clic sur section ${sectionId} détecté`);
    console.log(`🔧 DEBUG: Section active actuelle: ${activeSection}`);
    console.log(`🔧 DEBUG: Fonction onSectionChange disponible:`, typeof onSectionChange);
    
    onSectionChange(sectionId);
    
    console.log(`🔧 DEBUG: onSectionChange(${sectionId}) appelée`);
  };

  return (
    <div className="relative flex justify-center items-center py-16">
      {/* Central Hub */}
      <div className="relative z-10">
        {/* Central Circle */}
        <motion.div
          className="w-32 h-32 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-2xl flex items-center justify-center relative z-20"
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
              className="absolute z-30"
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
                onClick={() => handleSectionClick(section.id)}
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
                className={`
                  relative w-24 h-24 rounded-full p-0 transition-all duration-300 cursor-pointer z-50
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-110' 
                    : 'bg-white/90 backdrop-blur-sm hover:bg-white/95 text-gray-700 hover:scale-105'
                  }
                  ${isHovered ? 'shadow-xl' : ''}
                `}
                style={{ 
                  position: 'relative',
                  zIndex: 60
                }}
              >
                <Icon className="h-7 w-7" />
                
                {/* Tooltip - repositionné pour éviter les conflits */}
                <motion.div
                  className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap pointer-events-none z-70"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: isHovered ? 1 : 0,
                    y: isHovered ? 0 : 10
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {section.label}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black/90" />
                </motion.div>
              </Button>

              {/* Connection Lines - optimisées pour ne pas interférer */}
              <motion.div
                className="absolute top-1/2 left-1/2 origin-left h-0.5 bg-gradient-to-r from-purple-300 to-transparent pointer-events-none z-10"
                style={{
                  width: `${radius - 50}px`,
                  transform: `translate(-50%, -50%) rotate(${section.angle + 180}deg)`
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isActive ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>
          );
        })}

        {/* Particle Effects - bien isolés */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full pointer-events-none"
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
