
import React from 'react';
import { motion } from 'framer-motion';
import { Database, ExternalLink, Download } from 'lucide-react';
import { Button } from './ui/button';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';
import EtalabSubSection from './open-data/EtalabSubSection';
import LexiconSubSection from './open-data/LexiconSubSection';
import BioDivSubSection from './open-data/BioDivSubSection';

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
    switch (activeSubSection) {
      case 'etalab':
        return <EtalabSubSection marche={marche} theme={theme} />;
      case 'lexicon':
        return <LexiconSubSection marche={marche} theme={theme} />;
      case 'biodiv':
        return <BioDivSubSection marche={marche} theme={theme} />;
      default:
        return <EtalabSubSection marche={marche} theme={theme} />;
    }
  };

  return (
    <div className="space-y-8 pt-16">
      {/* Header Section */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl font-crimson font-bold flex items-center justify-center gap-3">
          <Database className="h-8 w-8 text-blue-600" />
          Open Data
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Explorez les données ouvertes de <span className="font-semibold text-blue-600">{marche.ville}</span>
        </p>
      </motion.div>

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
