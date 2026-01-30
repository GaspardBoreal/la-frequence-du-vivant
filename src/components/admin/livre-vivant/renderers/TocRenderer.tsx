import React from 'react';
import type { PageRendererProps } from '@/registries/types';
import type { TexteExport } from '@/utils/epubExportUtils';
import { groupTextesByPartie } from '@/utils/epubExportUtils';

interface TocData {
  textes: TexteExport[];
}

interface TocRendererProps extends PageRendererProps {
  data: TocData;
}

const TocRenderer: React.FC<TocRendererProps> = ({ 
  data,
  colorScheme, 
  typography,
  onNavigate 
}) => {
  const { textes } = data;
  const groupedContent = groupTextesByPartie(textes);

  const previewStyle = {
    fontFamily: `'${typography.bodyFont}', Georgia, serif`,
    fontSize: `${typography.baseFontSize * 0.9}rem`,
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
      <h2 
        className="text-xl md:text-2xl font-bold mb-6 text-center"
        style={headingStyle}
      >
        Table des Matières
      </h2>

      <div className="space-y-4 flex-1 overflow-auto">
        {groupedContent.map((group, groupIdx) => (
          <div key={group.partie?.id || `group-${groupIdx}`}>
            {/* Partie header */}
            {group.partie && (
              <div 
                className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: colorScheme.primary }}
                onClick={() => onNavigate?.(groupIdx + 2)} // +2 for cover and toc
              >
                <span className="font-bold">{group.partie.numeroRomain}</span>
                <span className="text-sm uppercase tracking-wide">{group.partie.titre}</span>
              </div>
            )}

            {/* Marches - marches is a Map<string, MarcheGroup> */}
            <div className="ml-4 space-y-1">
              {Array.from(group.marches.entries()).map(([marcheKey, marcheData], marcheIdx) => (
                <div 
                  key={`${group.partie?.id || 'no-partie'}-${marcheIdx}`}
                  className="flex items-baseline justify-between gap-2 text-sm"
                  style={{ color: colorScheme.secondary }}
                >
                  <span className="truncate">
                    {marcheKey}
                  </span>
                  <span 
                    className="text-xs flex-shrink-0"
                    style={{ color: colorScheme.accent }}
                  >
                    {marcheData.textes.length} texte{marcheData.textes.length > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TocRenderer;
