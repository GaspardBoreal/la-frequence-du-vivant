
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
      id: 'poeme' as const,
      label: 'Poème',
      icon: BookOpen,
      color: theme.colors.accent,
      description: 'Découvrez le poème'
    },
    {
      id: 'audio' as const,
      label: 'Audio',
      icon: Volume2,
      color: theme.colors.secondary,
      description: 'Écoutez les sons'
    },
    {
      id: 'visual' as const,
      label: 'Visuel',
      icon: Eye,
      color: theme.colors.primary,
      description: 'Explorez en images'
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
    <div className="relative flex justify-center items-center py-8 px-4">
      {/* Horizontal Navigation */}
      <div className="flex justify-center items-center gap-4 sm:gap-8">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const isHovered = hoveredSection === section.id;

          return (
            <motion.div
              key={section.id}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Button
                variant={isActive ? "default" : "outline"}
                size="lg"
                onClick={() => handleSectionClick(section.id)}
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
                className={`
                  relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0 transition-all duration-300 cursor-pointer
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-110' 
                    : 'bg-white/90 backdrop-blur-sm hover:bg-white/95 text-gray-700 hover:scale-105'
                  }
                  ${isHovered ? 'shadow-xl' : ''}
                `}
              >
                <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
              </Button>
              
              {/* Label below icon */}
              <motion.span
                className={`mt-2 text-sm sm:text-base font-medium transition-colors duration-300 ${
                  isActive ? 'text-purple-600' : 'text-gray-600'
                }`}
                animate={{
                  scale: isActive ? 1.05 : 1
                }}
                transition={{ duration: 0.2 }}
              >
                {section.label}
              </motion.span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="mt-1 w-2 h-2 bg-purple-500 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiSensoryNavigation;
