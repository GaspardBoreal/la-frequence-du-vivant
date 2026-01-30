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
  onNavigateToPageId 
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

  // Navigation handlers
  const handlePartieClick = (partieId: string | undefined, firstTexteId: string | undefined) => {
    if (!onNavigateToPageId) return;
    
    // Try partie page first, fallback to first text
    if (partieId) {
      const success = onNavigateToPageId(`partie-${partieId}`);
      if (success) return;
    }
    
    // Fallback to first texte of this partie
    if (firstTexteId) {
      onNavigateToPageId(`texte-${firstTexteId}`);
    }
  };

  const handleMarcheClick = (firstTexteId: string) => {
    onNavigateToPageId?.(`texte-${firstTexteId}`);
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
        {groupedContent.map((group, groupIdx) => {
          // Get first texte ID for fallback navigation
          const firstMarcheTextes = Array.from(group.marches.values())[0]?.textes;
          const firstTexteId = firstMarcheTextes?.[0]?.id;

          return (
            <div key={group.partie?.id || `group-${groupIdx}`}>
              {/* Partie header - clickable */}
              {group.partie && (
                <button
                  type="button"
                  onClick={() => handlePartieClick(group.partie?.id, firstTexteId)}
                  className="flex items-center gap-2 mb-2 w-full text-left transition-all hover:opacity-80 group"
                  style={{ color: colorScheme.primary }}
                  aria-label={`Aller à la partie ${group.partie.titre}`}
                >
                  <span className="font-bold">{group.partie.numeroRomain}</span>
                  <span className="text-sm uppercase tracking-wide group-hover:underline">
                    {group.partie.titre}
                  </span>
                </button>
              )}

              {/* Marches - each is clickable */}
              <div className="ml-4 space-y-1">
                {Array.from(group.marches.entries()).map(([marcheKey, marcheData], marcheIdx) => {
                  const marcheFirstTexteId = marcheData.textes[0]?.id;
                  
                  if (!marcheFirstTexteId) return null;

                  return (
                    <button
                      key={`${group.partie?.id || 'no-partie'}-${marcheIdx}`}
                      type="button"
                      onClick={() => handleMarcheClick(marcheFirstTexteId)}
                      className="flex items-baseline justify-between gap-2 text-sm w-full text-left py-1.5 px-2 rounded transition-all hover:bg-opacity-10 group"
                      style={{ 
                        color: colorScheme.secondary,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${colorScheme.secondary}15`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      aria-label={`Aller à ${marcheKey}`}
                    >
                      <span className="truncate group-hover:underline">
                        {marcheKey}
                      </span>
                      <span 
                        className="text-xs flex-shrink-0"
                        style={{ color: colorScheme.accent }}
                      >
                        {marcheData.textes.length} texte{marcheData.textes.length > 1 ? 's' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TocRenderer;
