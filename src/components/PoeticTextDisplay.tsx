
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Sparkles, Pause, Play } from 'lucide-react';
import { Button } from './ui/button';
import { RegionalTheme } from '../utils/regionalThemes';

interface PoeticTextDisplayProps {
  text: string;
  theme: RegionalTheme;
  title?: string;
  author?: string;
}

const PoeticTextDisplay: React.FC<PoeticTextDisplayProps> = ({
  text,
  theme,
  title,
  author
}) => {
  // Count sentences for stats only
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());

  // Simplify processRichText - no transformation needed
  const processRichText = (text: string) => {
    console.log('🎭 HTML brut reçu:', text);
    console.log('🎭 HTML traité final:', text);
    return text; // Return HTML as-is
  };

  // Fonction pour tronquer le titre si nécessaire
  const truncateTitle = (title: string, maxLength: number = 60) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        {/* Header avec troncature forcée */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-4">
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center space-x-3 flex-1 min-w-0 overflow-hidden">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden max-w-xs">
                {title && (
                  <h2 className="text-xs font-crimson font-bold text-white truncate w-full"
                      title={title}>
                    {truncateTitle(title, 50)}
                  </h2>
                )}
                {author && (
                  <p className="text-gray-300 text-xs truncate w-full"
                     title={author}>
                    {truncateTitle(author, 40)}
                  </p>
                )}
              </div>
            </div>
            
            {/* Icône décorative */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Quote className="h-4 w-4 text-white/60" />
            </div>
          </div>
        </div>

        {/* Text Content - Single HTML block */}
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div 
              className="text-lg text-gray-800 font-serif prose prose-sm max-w-none"
              style={{ 
                whiteSpace: 'pre-wrap',
                wordSpacing: '0.1em'
              }}
              dangerouslySetInnerHTML={{ __html: processRichText(text) }}
            />
          </motion.div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Texte poétique</span>
              <span>•</span>
              <span>{sentences.length} phrases</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Format enrichi</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PoeticTextDisplay;
