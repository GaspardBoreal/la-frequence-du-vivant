
import React, { useState } from 'react';
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
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

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

  const handleMenuClick = (sectionId: 'opendata' | 'datacollect' | 'creative') => {
    const section = menuSections.find(s => s.id === sectionId);
    if (section && section.subMenus.length > 0) {
      if (expandedMenu === sectionId) {
        setExpandedMenu(null);
      } else {
        setExpandedMenu(sectionId);
        // Si ce n'est pas déjà la section active, activer le premier sous-menu
        if (activeSection !== sectionId) {
          onSectionChange(sectionId, section.subMenus[0].id);
        }
      }
    } else {
      onSectionChange(sectionId);
    }
  };

  const handleSubMenuClick = (sectionId: 'opendata' | 'datacollect' | 'creative', subSectionId: string) => {
    onSectionChange(sectionId, subSectionId);
    setExpandedMenu(null);
  };

  return (
    <div className="w-full py-8">
      {/* Navigation horizontale principale */}
      <div className="flex justify-center items-center gap-8 mb-6">
        {menuSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const isExpanded = expandedMenu === section.id;
          
          return (
            <div key={section.id} className="relative">
              <Button
                variant={isActive ? "default" : "outline"}
                size="lg"
                onClick={() => handleMenuClick(section.id)}
                className={`
                  flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg' 
                    : 'bg-white/90 hover:bg-white text-gray-700 hover:shadow-md border border-gray-200'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{section.label}</span>
                {section.subMenus.length > 0 && (
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                )}
              </Button>
              
              {/* Sous-menus déroulants */}
              {section.subMenus.length > 0 && isExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-48"
                >
                  {section.subMenus.map((subMenu) => (
                    <button
                      key={subMenu.id}
                      onClick={() => handleSubMenuClick(section.id, subMenu.id)}
                      className={`
                        w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors
                        ${activeSubSection === subMenu.id && activeSection === section.id
                          ? 'bg-purple-50 text-purple-700 font-medium' 
                          : 'text-gray-700'
                        }
                      `}
                    >
                      {subMenu.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Indicateur de section active */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-200">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-purple-700 font-medium text-sm">
            {menuSections.find(s => s.id === activeSection)?.label}
            {activeSubSection && (
              <>
                {' → '}
                {menuSections
                  .find(s => s.id === activeSection)
                  ?.subMenus.find(sub => sub.id === activeSubSection)?.label
                }
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedMultiSensoryNavigation;
