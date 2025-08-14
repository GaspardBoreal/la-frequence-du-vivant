
import React from 'react';
import { motion } from 'framer-motion';
import { Database, ExternalLink, Download } from 'lucide-react';
import { Button } from './ui/button';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';
import LexiconSubSection from './open-data/LexiconSubSection';
import BioDivSubSection from './open-data/BioDivSubSection';
import ProjectionsSubSection from './open-data/ProjectionsSubSection';

interface OpenDataSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
  activeSubSection: string;
}

const OpenDataSection: React.FC<OpenDataSectionProps> = ({
  marche,
  theme,
  activeSubSection
}) => {
  const renderSubSection = () => {
    console.log('🔄 [OPEN DATA SECTION] Rendu subsection:', activeSubSection);
    switch (activeSubSection) {
      case 'lexicon':
        return <LexiconSubSection marche={marche} theme={theme} />;
      case 'biodiv':
        return <BioDivSubSection marche={marche} theme={theme} />;
      case 'projections':
        return <ProjectionsSubSection marche={marche} theme={theme} />;
      default:
        return <ProjectionsSubSection marche={marche} theme={theme} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Sub-section Content */}
      <motion.div
        key={activeSubSection}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {renderSubSection()}
      </motion.div>
    </div>
  );
};

export default OpenDataSection;
