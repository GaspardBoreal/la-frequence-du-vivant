
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Eye, 
  Volume2, 
  BookOpen,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Button } from './ui/button';
import { RegionalTheme } from '../utils/regionalThemes';

interface SimplifiedMultiSensoryNavigationProps {
  activeSection: 'opendata' | 'datacollect' | 'creative';
  activeSubSection: string;
  onSectionChange: (section: 'opendata' | 'datacollect' | 'creative', subSection?: string) => void;
  theme: RegionalTheme;
}

const SimplifiedMultiSensoryNavigation: React.FC<SimplifiedMultiSensoryNavigationProps> = ({
  activeSection,
  activeSubSection,
  onSectionChange,
  theme
}) => {
  const menuSections = [
    {
      id: 'opendata' as const,
      label: 'Open Data',
      icon: Database,
      color: theme.colors.primary,
      subMenus: [
        { id: 'etalab', label: 'Etalab' },
        { id: 'lexicon', label: 'Lexicon' },
        { id: 'biodiv', label: 'BioDiv' }
      ]
    },
    {
      id: 'datacollect' as const,
      label: 'Data Collect',
      icon: Eye,
      color: theme.colors.secondary,
      subMenus: [
        { id: 'visual', label: 'Visuel' },
        { id: 'audio', label: 'Audio' }
      ]
    },
    {
      id: 'creative' as const,
      label: 'Creative',
      icon: BookOpen,
      color: theme.colors.accent,
      subMenus: [
        { id: 'poeme', label: 'Poème' },
        { id: 'haiku', label: 'Haïku' }
      ]
    }
  ];

  const handleSectionClick = (sectionId: 'opendata' | 'datacollect' | 'creative') => {
    const section = menuSections.find(s => s.id === sectionId);
    if (section) {
      const currentSubMenus = section.subMenus;
      const currentSubIndex = currentSubMenus.findIndex(sub => sub.id === activeSubSection);
      
      if (activeSection === sectionId) {
        // Si on est déjà sur cette section, passer au sous-menu suivant
        const nextSubIndex = (currentSubIndex + 1) % currentSubMenus.length;
        onSectionChange(sectionId, currentSubMenus[nextSubIndex].id);
      } else {
        // Sinon, activer cette section avec son premier sous-menu
        onSectionChange(sectionId, currentSubMenus[0].id);
      }
    }
  };

  const getCurrentSectionLabel = (sectionId: 'opendata' | 'datacollect' | 'creative') => {
    const section = menuSections.find(s => s.id === sectionId);
    if (section && activeSection === sectionId) {
      const activeSubMenu = section.subMenus.find(sub => sub.id === activeSubSection);
      return activeSubMenu ? `${section.label} - ${activeSubMenu.label}` : section.label;
    }
    return section?.label || '';
  };

  return (
    <div className="w-full py-8">
      {/* Navigation horizontale principale */}
      <div className="flex justify-center items-center gap-8 mb-6">
        {menuSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const sectionLabel = getCurrentSectionLabel(section.id);
          
          return (
            <motion.div 
              key={section.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={isActive ? "default" : "outline"}
                size="lg"
                onClick={() => handleSectionClick(section.id)}
                className={`
                  flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg' 
                    : 'bg-white/90 hover:bg-white text-gray-700 hover:shadow-md border border-gray-200'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{sectionLabel}</span>
                {section.subMenus.length > 1 && isActive && (
                  <ChevronDown className="h-4 w-4 opacity-60" />
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Indicateur subtil du sous-menu actuel */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-purple-50/50 rounded-full border border-purple-200/50">
          <Sparkles className="h-3 w-3 text-purple-500" />
          <span className="text-purple-600 font-medium text-xs">
            {menuSections.find(s => s.id === activeSection)?.subMenus.length || 0 > 1 
              ? 'Cliquer pour alterner les sous-sections' 
              : 'Section active'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedMultiSensoryNavigation;
