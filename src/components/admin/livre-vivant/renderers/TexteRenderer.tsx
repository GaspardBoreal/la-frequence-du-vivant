import React from 'react';
import type { PageRendererProps } from '@/registries/types';
import type { TexteExport } from '@/utils/epubExportUtils';

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

// Strip HTML tags for clean display
const stripHtml = (html: string): string => {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const TexteRenderer: React.FC<TexteRendererProps> = ({ 
  data, 
  colorScheme, 
  typography 
}) => {
  const { texte, marche } = data;
  const isHaiku = texte.type_texte?.toLowerCase() === 'haiku';
  const isSenryu = texte.type_texte?.toLowerCase() === 'senryu';
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

  const cleanContent = stripHtml(texte.contenu);

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

      {/* Content */}
      <div 
        className={`flex-1 overflow-auto ${isCentered ? 'text-center' : ''}`}
      >
        {cleanContent.split('\n\n').map((paragraph, idx) => (
          <p key={idx} className="mb-4 last:mb-0">
            {paragraph.split('\n').map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {line}
                {lineIdx < paragraph.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
};

export default TexteRenderer;
