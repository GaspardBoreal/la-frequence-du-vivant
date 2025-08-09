
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Eye, 
  Volume2, 
  BookOpen,
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
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  const menuSections = [
    {
      id: 'opendata' as const,
      label: 'Open Data',
      icon: Database,
      color: theme.colors.primary,
      subMenus: [
        { id: 'biodiv', label: 'BioDiv' },
        { id: 'lexicon', label: 'Lexicon' },
        { id: 'etalab', label: 'Satellite Copernicus' }
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

  const toggleDropdown = (sectionId: string) => {
    // Créer un nouveau Set à chaque fois
    const newOpenDropdowns = new Set<string>();
    
    // Si le dropdown cliqué n'était pas ouvert, l'ouvrir (et fermer tous les autres)
    if (!openDropdowns.has(sectionId)) {
      newOpenDropdowns.add(sectionId);
    }
    // Si le dropdown cliqué était déjà ouvert, il restera fermé (Set vide)
    
    setOpenDropdowns(newOpenDropdowns);
  };

  const handleSubMenuClick = (sectionId: 'opendata' | 'datacollect' | 'creative', subSectionId: string) => {
    onSectionChange(sectionId, subSectionId);
    // Fermer tous les dropdowns après sélection
    setOpenDropdowns(new Set());
    // Scroll vers le haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="w-full py-4">
      {/* Navigation horizontale principale */}
      <div className="flex justify-center items-center gap-8">
        {menuSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const isDropdownOpen = openDropdowns.has(section.id);
          const sectionLabel = getCurrentSectionLabel(section.id);
          
          return (
            <div key={section.id} className="relative">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={isActive ? "default" : "outline"}
                  size="lg"
                  onClick={() => toggleDropdown(section.id)}
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
                  <ChevronDown 
                    className={`h-4 w-4 opacity-60 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </Button>
              </motion.div>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50 
                               bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px]"
                  >
                    <div className="py-2">
                      {section.subMenus.map((subMenu) => (
                        <button
                          key={subMenu.id}
                          onClick={() => handleSubMenuClick(section.id, subMenu.id)}
                          className={`
                            w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors
                            flex items-center gap-3 text-sm
                            ${activeSection === section.id && activeSubSection === subMenu.id 
                              ? 'bg-purple-50 text-purple-700 font-medium' 
                              : 'text-gray-700'
                            }
                          `}
                        >
                          <Icon className="h-4 w-4" />
                          {subMenu.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimplifiedMultiSensoryNavigation;
