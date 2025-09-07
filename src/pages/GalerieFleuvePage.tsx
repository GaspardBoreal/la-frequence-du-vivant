import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GalerieFleuve from '../components/GalerieFleuve';
import { useSupabaseMarches } from '../hooks/useSupabaseMarches';
import { REGIONAL_THEMES } from '../utils/regionalThemes';
import { useSearchParams } from 'react-router-dom';

const GalerieFleuvePage: React.FC = () => {
  const { data: marches = [], isLoading } = useSupabaseMarches();
  const [searchParams] = useSearchParams();
  
  // Get view mode from URL parameters
  const viewMode = searchParams.get('view') as 'galerie' | 'fleuve-temporel' | null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-green-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Initialisation de la Galerie-Fleuve...</p>
        </motion.div>
      </div>
    );
  }


  return (
    <AnimatePresence>
      <motion.div
        className="min-h-screen bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Galerie principale */}
        <GalerieFleuve 
          explorations={marches} 
          themes={Object.values(REGIONAL_THEMES)}
          viewMode={viewMode || 'galerie'}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default GalerieFleuvePage;