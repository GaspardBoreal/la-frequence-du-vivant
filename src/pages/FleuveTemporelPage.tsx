import React from 'react';
import { motion } from 'framer-motion';
import FleuveTemporel from '../components/FleuveTemporel';
import { useSupabaseMarches } from '../hooks/useSupabaseMarches';

const FleuveTemporelPage: React.FC = () => {
  const { data: marches = [], isLoading } = useSupabaseMarches();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-accent/80 to-secondary text-primary-foreground">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 border-4 border-primary-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Chargement du fleuve temporel...</p>
        </motion.div>
      </div>
    );
  }

  return <FleuveTemporel explorations={marches} />;
};

export default FleuveTemporelPage;