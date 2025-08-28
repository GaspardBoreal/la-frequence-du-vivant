import React from 'react';
import { motion } from 'framer-motion';
import { getTextTypeInfo } from '@/types/textTypes';
import type { MarcheTexte } from '@/hooks/useMarcheTextes';
import { cn } from '@/lib/utils';

interface AdaptiveTextRendererProps {
  text: MarcheTexte;
  isActive: boolean;
}

export default function AdaptiveTextRenderer({ text, isActive }: AdaptiveTextRendererProps) {
  const typeInfo = getTextTypeInfo(text.type_texte);
  const style = typeInfo.adaptiveStyle;

  // Format content based on text type
  const formatContent = (content: string, type: string) => {
    switch (type) {
      case 'haiku':
        // Split haiku into 3 lines
        const lines = content.split('\n').filter(line => line.trim());
        return lines.map((line, i) => (
          <div key={i} className="text-center">
            {line.trim()}
          </div>
        ));
      
      case 'dialogue-polyphonique':
        // Format dialogue with speakers
        return content.split('\n').map((line, i) => {
          if (line.startsWith('—') || line.startsWith('-')) {
            return (
              <div key={i} className="ml-4 italic">
                {line}
              </div>
            );
          }
          return <div key={i}>{line}</div>;
        });
      
      case 'fragment':
        return (
          <div className="text-center text-xl font-medium">
            "{content}"
          </div>
        );
      
      default:
        return content.split('\n').map((line, i) => (
          <div key={i} className={line.trim() ? '' : 'h-2'}>
            {line}
          </div>
        ));
    }
  };

  return (
    <motion.div
      key={text.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isActive ? 1 : 0.7, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "p-4 rounded-lg transition-all duration-300",
        isActive ? "bg-background shadow-sm border" : "bg-muted/20",
        style.spacing
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
        <span className="text-lg">{typeInfo.icon}</span>
        <div className="flex-1">
          <h3 className="font-medium text-sm text-foreground">{text.titre}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{typeInfo.label}</span>
            <span>•</span>
            <span>#{text.ordre}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "transition-all duration-300",
        style.fontFamily === 'serif' ? 'font-serif' : style.fontFamily === 'monospace' ? 'font-mono' : 'font-sans',
        style.fontSize,
        style.lineHeight,
        text.type_texte === 'haiku' ? 'text-center' : 
        text.type_texte === 'fragment' ? 'text-center' : 'text-left'
      )}>
        {formatContent(text.contenu, text.type_texte)}
      </div>

      {/* Metadata */}
      {text.metadata && Object.keys(text.metadata).length > 0 && (
        <div className="mt-3 pt-2 border-t border-border/30">
          <div className="text-xs text-muted-foreground space-y-1">
            {Object.entries(text.metadata).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium">{key}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}