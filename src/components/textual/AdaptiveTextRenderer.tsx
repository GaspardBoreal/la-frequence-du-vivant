import React from 'react';
import { motion } from 'framer-motion';
import { getTextTypeInfo } from '@/types/textTypes';
import type { MarcheTexte } from '@/hooks/useMarcheTextes';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface AdaptiveTextRendererProps {
  text: MarcheTexte;
  isActive: boolean;
}

export default function AdaptiveTextRenderer({ text, isActive }: AdaptiveTextRendererProps) {
  const typeInfo = getTextTypeInfo(text.type_texte);
  const style = typeInfo.adaptiveStyle;

  // Format content based on text type
  const formatContent = (content: string, type: string) => {
    // Sanitize HTML content first
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['div', 'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'span'],
      ALLOWED_ATTR: []
    });

    switch (type) {
      case 'haiku':
        // Convert HTML blocks and <br> to line breaks, then split
        const htmlWithBreaks = sanitizedContent
          .replace(/<br\s*\/?\>/gi, '\n')
          .replace(/<\/(div|p|li|h[1-6])>/gi, '\n');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlWithBreaks;
        const plainText = (tempDiv.textContent || tempDiv.innerText || '')
          .replace(/\u00A0/g, ' ') // nbsp to space
          .replace(/\s+/g, ' ')    // collapse spaces
          .replace(/\n{2,}/g, '\n')
          .trim();
        const lines = plainText.split('\n').map(l => l.trim()).filter(Boolean);
        return lines.map((line, i) => (
          <div key={i} className="text-center">
            {line}
          </div>
        ));
      
      case 'dialogue-polyphonique':
        // For dialogue, extract plain text and format
        const tempDiv2 = document.createElement('div');
        tempDiv2.innerHTML = sanitizedContent;
        const dialogueText = tempDiv2.textContent || tempDiv2.innerText || '';
        return dialogueText.split('\n').map((line, i) => {
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
        // For fragment, extract plain text and center
        const tempDiv3 = document.createElement('div');
        tempDiv3.innerHTML = sanitizedContent;
        const fragmentText = tempDiv3.textContent || tempDiv3.innerText || '';
        return (
          <div className="text-center text-xl font-medium">
            "{fragmentText}"
          </div>
        );
      
      default:
        // For other types, render HTML directly
        return (
          <div 
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            className="prose prose-sm max-w-none"
          />
        );
    }
  };

  return (
    <motion.div
      key={text.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isActive ? 1 : 0.7, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "p-4 rounded-lg transition-all duration-300 border shadow-sm",
        "bg-paper text-ink",
        style.spacing
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-ink/20">
        <span className="text-lg">{typeInfo.icon}</span>
        <div className="flex-1">
          <h3 className="font-medium text-sm text-ink">{text.titre}</h3>
          <div className="flex items-center gap-2 text-xs text-ink/60">
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
        (typeInfo.family === 'poetique' || text.type_texte === 'haiku' || text.type_texte === 'fragment') ? 'text-center' : 'text-left',
        typeInfo.family === 'narrative' ? 'ml-8 md:ml-16 indent-8 md:indent-12' : ''
      )}>
        {formatContent(text.contenu, text.type_texte)}
      </div>

      {/* Metadata */}
      {text.metadata && Object.keys(text.metadata).length > 0 && (
        <div className="mt-3 pt-2 border-t border-ink/20">
          <div className="text-xs text-ink/60 space-y-1">
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