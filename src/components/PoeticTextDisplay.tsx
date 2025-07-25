
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Quote, Eye, EyeOff, Sparkles, Pause, Play } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [isAutoReading, setIsAutoReading] = useState(false);
  const [showReadingMode, setShowReadingMode] = useState(false);

  // Split text into paragraphs and sentences
  const paragraphs = text.split('\n').filter(p => p.trim());
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  // Auto-reading effect
  useEffect(() => {
    if (isAutoReading && currentParagraph < paragraphs.length - 1) {
      const timer = setTimeout(() => {
        setCurrentParagraph(prev => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAutoReading, currentParagraph, paragraphs.length]);

  // Get preview text (first 2 sentences)
  const previewText = sentences.slice(0, 2).join('. ') + '.';

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setCurrentParagraph(0);
    }
  };

  const handleAutoReading = () => {
    setIsAutoReading(!isAutoReading);
    if (!isAutoReading) {
      setCurrentParagraph(0);
    }
  };

  // Highlight key phrases
  const highlightText = (text: string) => {
    const keyPhrases = ['pont', 'Saint-Denis', 'modernité', 'Isle', 'techno sensible', 'fréquence'];
    let highlighted = text;
    
    keyPhrases.forEach(phrase => {
      const regex = new RegExp(`(${phrase})`, 'gi');
      highlighted = highlighted.replace(regex, `<span class="font-semibold text-${theme.colors.primary} bg-${theme.colors.primary}/10 px-1 rounded">$1</span>`);
    });
    
    return highlighted;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Collapsed State - Preview */}
      <AnimatePresence mode="wait">
        {!isExpanded && (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative group cursor-pointer"
            onClick={handleToggleExpand}
          >
            <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1">
              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 opacity-20">
                <Quote className="h-8 w-8 text-gray-400 transform rotate-12" />
              </div>
              
              {/* Title */}
              {title && (
                <h3 className="text-lg font-crimson font-bold text-gray-800 mb-4 leading-tight">
                  {title}
                </h3>
              )}
              
              {/* Preview Text */}
              <div className="relative">
                <p className="text-sm leading-relaxed text-gray-700 font-serif italic mb-6">
                  <span className="text-2xl font-bold text-gray-300 float-left mr-2 mt-1 leading-none">«</span>
                  {previewText}
                  <span className="text-gray-400 ml-2">...</span>
                </p>
                
                {/* Fade overlay */}
                <div className="absolute bottom-0 right-0 w-32 h-8 bg-gradient-to-l from-white via-white to-transparent" />
              </div>
              
              {/* Expand Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Book className="h-4 w-4" />
                  <span>Texte intégral</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Lire</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded State - Full Text */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    {title && (
                      <h2 className="text-base font-crimson font-bold">{title}</h2>
                    )}
                    {author && (
                      <p className="text-gray-300 text-sm">{author}</p>
                    )}
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReadingMode(!showReadingMode)}
                    className="text-white hover:bg-white/20"
                  >
                    {showReadingMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAutoReading}
                    className="text-white hover:bg-white/20"
                  >
                    {isAutoReading ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleExpand}
                    className="text-white hover:bg-white/20"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="p-8">
              {showReadingMode ? (
                // Reading Mode - Paragraph by paragraph
                <div className="space-y-6">
                  {paragraphs.map((paragraph, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: isAutoReading ? (index <= currentParagraph ? 1 : 0.3) : 1,
                        x: 0,
                        scale: isAutoReading && index === currentParagraph ? 1.02 : 1
                      }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className={`relative ${isAutoReading && index === currentParagraph ? 'bg-yellow-50 rounded-lg p-4' : ''}`}
                    >
                      <p 
                        className="text-sm leading-relaxed text-gray-800 font-serif"
                        dangerouslySetInnerHTML={{ __html: highlightText(paragraph) }}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Full Text Mode
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="prose prose-sm max-w-none"
                >
                  <div className="text-gray-800 font-serif leading-relaxed space-y-6">
                    {paragraphs.map((paragraph, index) => (
                      <motion.p
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: highlightText(paragraph) }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>{paragraphs.length} paragraphes</span>
                  <span>•</span>
                  <span>{sentences.length} phrases</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Mode lecture</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PoeticTextDisplay;
