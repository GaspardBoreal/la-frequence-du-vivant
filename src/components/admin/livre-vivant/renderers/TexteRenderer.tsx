import React from 'react';
import type { PageRendererProps } from '@/registries/types';
import type { TexteExport } from '@/utils/epubExportUtils';
import { sanitizeHtml } from '@/utils/htmlSanitizer';

interface TexteData {
  texte: TexteExport;
  marche: {
    nom?: string;
    ville?: string;
  };
  partie?: {
    numeroRomain: string;
    titre: string;
  };
}

interface TexteRendererProps extends PageRendererProps {
  data: TexteData;
}

/**
 * Renders haiku/senryu content with proper line-by-line centering
 * Preserves rich text formatting (bold, italic) within each line
 */
const renderHaikuContent = (content: string, colorScheme: { text: string }) => {
  const sanitizedContent = sanitizeHtml(content);
  
  // Convert HTML breaks to newlines, then split by lines
  const contentWithBreaks = sanitizedContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p)>/gi, '\n')
    .replace(/<(div|p)[^>]*>/gi, '\n')
    .replace(/\n{2,}/g, '\n');
  
  // Split by lines while preserving HTML formatting in each line
  const lines = contentWithBreaks
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  
  return (
    <div className="flex flex-col items-center justify-center h-full">
      {lines.map((line, i) => (
        <div 
          key={i} 
          className="text-center mb-2 last:mb-0 [&_strong]:font-bold [&_em]:italic"
          style={{ color: colorScheme.text }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(line) }}
        />
      ))}
    </div>
  );
};

/**
 * Renders standard prose content with rich text support
 * Handles bold, italic, paragraphs, line breaks
 */
const renderProseContent = (content: string, colorScheme: { text: string }) => {
  const sanitizedContent = sanitizeHtml(content);
  
  return (
    <div 
      className="prose prose-sm max-w-none [&_strong]:font-bold [&_em]:italic [&_p]:mb-4 [&_p:last-child]:mb-0"
      style={{ color: colorScheme.text }}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

const TexteRenderer: React.FC<TexteRendererProps> = ({ 
  data, 
  colorScheme, 
  typography 
}) => {
  const { texte, marche } = data;
  const typeTexte = texte.type_texte?.toLowerCase() || '';
  const isHaiku = typeTexte === 'haiku' || typeTexte === 'haïku';
  const isSenryu = typeTexte === 'senryu';
  const isCentered = isHaiku || isSenryu;

  const previewStyle = {
    fontFamily: `'${typography.bodyFont}', Georgia, serif`,
    fontSize: `${typography.baseFontSize}rem`,
    lineHeight: typography.lineHeight,
    color: colorScheme.text,
    backgroundColor: colorScheme.background,
  };

  const headingStyle = {
    fontFamily: `'${typography.headingFont}', serif`,
    color: colorScheme.primary,
  };

  return (
    <div 
      className="h-full flex flex-col p-6 md:p-8 overflow-auto"
      style={previewStyle}
    >
      {/* Marche Header */}
      <div 
        className="mb-4 pb-2 flex-shrink-0"
        style={{ borderBottom: `2px solid ${colorScheme.accent}` }}
      >
        <h2 
          className="text-lg md:text-xl font-semibold"
          style={headingStyle}
        >
          {marche.nom || marche.ville || 'Lieu'}
        </h2>
        {texte.marche_date && (
          <p 
            className="text-sm italic"
            style={{ color: colorScheme.secondary }}
          >
            {new Date(texte.marche_date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Type Header */}
      <h3 
        className="text-xs uppercase tracking-wide mb-3 flex-shrink-0"
        style={{ color: colorScheme.secondary }}
      >
        {texte.type_texte || 'Texte'}
      </h3>

      {/* Title */}
      <h4 
        className="text-base md:text-lg font-semibold mb-4 flex-shrink-0"
        style={headingStyle}
      >
        {texte.titre}
      </h4>

      {/* Content - with proper HTML rendering */}
      <div className={`flex-1 overflow-auto ${isCentered ? 'flex items-center justify-center' : ''}`}>
        {isCentered 
          ? renderHaikuContent(texte.contenu, colorScheme)
          : renderProseContent(texte.contenu, colorScheme)
        }
      </div>
    </div>
  );
};

export default TexteRenderer;
