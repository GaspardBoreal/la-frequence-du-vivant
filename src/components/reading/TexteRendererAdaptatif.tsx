import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getTextTypeInfo } from '@/types/textTypes';
import type { ExplorationTextOptimized } from '@/hooks/useExplorationTextsOptimized';
import { BookOpen, Quote, Feather } from 'lucide-react';
import { ReadingMode } from '@/types/readingTypes';

interface Props {
  texte: ExplorationTextOptimized;
  readingMode?: ReadingMode;
}

export default function TexteRendererAdaptatif({ texte, readingMode = 'rich' }: Props) {
  const typeInfo = getTextTypeInfo(texte.type_texte);
  
  const renderHaiku = () => (
    <div className={`min-h-screen flex flex-col justify-center px-4 py-8 ${
      readingMode === 'focus' 
        ? 'bg-white dark:bg-slate-900' 
        : 'bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900'
    }`}>
      {/* Enhanced container with subtle styling */}
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`
            ${readingMode === 'focus' ? 'p-0' : 'p-8 md:p-12'}
            ${readingMode !== 'standard' ? 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50' : ''}
          `}
        >
          {/* Titre avec décoration subtile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center mb-12"
          >
            {readingMode === 'rich' && (
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <Feather className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            )}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed tracking-wide">
              {texte.titre}
            </h1>
            {readingMode === 'rich' && (
              <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 mx-auto mt-6 rounded-full"></div>
            )}
          </motion.div>

          {/* Haïku centré avec mise en forme élégante */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className={`max-w-lg mx-auto ${readingMode === 'rich' ? 'relative' : ''}`}>
              {readingMode === 'rich' && (
                <Quote className="absolute -top-4 -left-8 h-8 w-8 text-emerald-200 dark:text-emerald-700" />
              )}
              <div 
                className="text-xl md:text-2xl leading-loose text-slate-700 dark:text-slate-200 font-serif italic"
                style={{ 
                  textAlign: 'left',
                  paddingLeft: '3rem',
                  lineHeight: '2.8rem',
                  letterSpacing: '0.03em'
                }}
              >
                {texte.contenu?.split('\n').map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.4, duration: 0.6 }}
                    className="block mb-2"
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Métadonnées élégantes */}
          {readingMode !== 'focus' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="text-center mt-12"
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                <Badge variant="secondary" className="text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  {texte.marcheName}
                </Badge>
                <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {typeInfo.label}
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );

  const renderDefault = () => (
    <div className={`min-h-screen py-8 px-4 ${
      readingMode === 'focus' 
        ? 'bg-white dark:bg-slate-900' 
        : 'bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className={`
          ${readingMode !== 'standard' ? 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-3xl' : 'bg-white dark:bg-slate-900 rounded-xl shadow-lg'}
          ${readingMode === 'focus' ? 'border-none shadow-none bg-transparent' : ''}
          transition-all duration-300
        `}>
          <div className={readingMode === 'focus' ? 'p-0' : 'p-8 md:p-12'}>
            <div className="text-center mb-8">
              {readingMode === 'rich' && (
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <BookOpen className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
              )}
              
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4 leading-tight">
                {texte.titre}
              </h1>
              
              {readingMode !== 'focus' && (
                <div className="flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <span className="mr-2">{typeInfo.icon}</span>
                    {typeInfo.label}
                  </Badge>
                  <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    {texte.marcheName}
                  </Badge>
                </div>
              )}
              
              {readingMode === 'rich' && (
                <div className="w-32 h-1 bg-gradient-to-r from-slate-300 to-slate-500 dark:from-slate-600 dark:to-slate-400 mx-auto mt-6 rounded-full"></div>
              )}
            </div>

            <div className={`prose prose-lg max-w-none ${
              readingMode === 'focus' 
                ? 'prose-slate dark:prose-invert text-lg leading-relaxed' 
                : 'prose-slate dark:prose-invert'
            }`}>
              {texte.contenu?.split('\n\n').map((paragraph, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  className={`mb-6 text-slate-700 dark:text-slate-200 ${
                    readingMode === 'focus' ? 'text-xl leading-relaxed' : 'text-lg'
                  }`}
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // Render based on text type
  switch (texte.type_texte) {
    case 'haiku':
      return renderHaiku();
    default:
      return renderDefault();
  }
}