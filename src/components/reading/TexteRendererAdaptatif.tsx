import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getTextTypeInfo } from '@/types/textTypes';
import type { ExplorationTextOptimized } from '@/hooks/useExplorationTextsOptimized';

interface Props {
  texte: ExplorationTextOptimized;
  focusMode?: boolean;
}

export default function TexteRendererAdaptatif({ texte, focusMode = false }: Props) {
  const typeInfo = getTextTypeInfo(texte.type_texte);
  
  const renderHaiku = () => (
    <div className="min-h-screen flex flex-col justify-center px-4 py-8">
      {/* Titre centré avec espacement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-16"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-relaxed">
          {texte.titre}
        </h1>
      </motion.div>

      {/* Haïku centré avec indentations */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="flex-1 flex items-center justify-center"
      >
        <div className="max-w-md mx-auto">
          <div 
            className="text-lg md:text-xl leading-loose text-foreground font-serif"
            style={{ 
              textAlign: 'left',
              paddingLeft: '2rem', // Double indentation
              lineHeight: '2.5rem',
              letterSpacing: '0.02em'
            }}
          >
            {texte.contenu?.split('\n').map((line, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.3 }}
                className="block"
              >
                {line}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Métadonnées discrètes en bas */}
      {!focusMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center mt-8"
        >
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {texte.marcheName}
            </Badge>
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderDefault = () => (
    <div className="min-h-screen py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {texte.titre}
              </h1>
              {!focusMode && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">
                    {texte.marcheName}
                  </Badge>
                </div>
              )}
            </div>

            <div className="prose prose-lg max-w-none text-foreground leading-relaxed">
              {texte.contenu?.split('\n\n').map((paragraph, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="mb-4"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>
          </CardContent>
        </Card>
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