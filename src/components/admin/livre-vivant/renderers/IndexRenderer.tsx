import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PageRendererProps } from '@/registries/types';
import type { TexteExport } from '@/utils/epubExportUtils';
import { getIndexType } from '@/registries/indexTypes';

interface IndexData {
  textes: TexteExport[];
}

interface IndexRendererProps extends PageRendererProps {
  data: IndexData;
  indexType: 'lieu' | 'genre';
}

const IndexRenderer: React.FC<IndexRendererProps> = ({ 
  data,
  indexType,
  colorScheme, 
  typography,
  onNavigateToPageId
}) => {
  const { textes } = data;
  const indexConfig = getIndexType(indexType);
  const indexData = indexConfig?.extractor(textes);
  
  // Track which entries are expanded
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

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

  const toggleEntry = (label: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const handleTexteClick = (texteId: string) => {
    onNavigateToPageId?.(`texte-${texteId}`);
  };

  // Helper to get texte details from ID
  const getTexteDetails = (texteId: string) => {
    return textes.find(t => t.id === texteId);
  };

  if (!indexData) {
    return (
      <div className="h-full flex items-center justify-center" style={previewStyle}>
        <p style={{ color: colorScheme.secondary }}>Index non disponible</p>
      </div>
    );
  }

  return (
    <div 
      className="h-full flex flex-col p-6 md:p-8 overflow-auto"
      style={previewStyle}
    >
      <h2 
        className="text-xl md:text-2xl font-bold mb-6 text-center"
        style={headingStyle}
      >
        {indexConfig?.label || 'Index'}
      </h2>

      <div className="space-y-1 flex-1 overflow-auto">
        {indexData.entries.map((entry, idx) => {
          const isExpanded = expandedEntries.has(entry.label);
          const hasTextes = entry.texteIds && entry.texteIds.length > 0;
          const isClickable = hasTextes && onNavigateToPageId;

          return (
            <div key={idx} className="break-inside-avoid">
              {/* Entry header - clickable to expand */}
              <button
                type="button"
                onClick={() => isClickable && toggleEntry(entry.label)}
                disabled={!isClickable}
                className={`flex items-center justify-between gap-2 w-full text-left py-2 px-3 rounded transition-all ${
                  isClickable ? 'hover:bg-opacity-10 cursor-pointer' : 'cursor-default'
                }`}
                style={{
                  backgroundColor: isExpanded ? `${colorScheme.accent}15` : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (isClickable && !isExpanded) {
                    e.currentTarget.style.backgroundColor = `${colorScheme.secondary}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                aria-expanded={isExpanded}
                aria-label={`${entry.label} - ${entry.count} textes`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isClickable && (
                    <span style={{ color: colorScheme.accent }}>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      )}
                    </span>
                  )}
                  <span className="capitalize truncate">{entry.label}</span>
                </div>
                
                {entry.count !== undefined && (
                  <span 
                    className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: colorScheme.accent + '20',
                      color: colorScheme.accent 
                    }}
                  >
                    {entry.count}
                  </span>
                )}
              </button>

              {/* Expanded texte list */}
              <AnimatePresence>
                {isExpanded && entry.texteIds && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div 
                      className="ml-6 pl-3 border-l-2 space-y-1 py-2"
                      style={{ borderColor: `${colorScheme.accent}40` }}
                    >
                      {entry.texteIds.map((texteId) => {
                        const texte = getTexteDetails(texteId);
                        if (!texte) return null;

                        return (
                          <button
                            key={texteId}
                            type="button"
                            onClick={() => handleTexteClick(texteId)}
                            className="w-full text-left py-1.5 px-2 rounded text-sm transition-all hover:bg-opacity-15 group"
                            style={{ color: colorScheme.text }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${colorScheme.accent}15`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            aria-label={`Lire ${texte.titre}`}
                          >
                            <span className="group-hover:underline font-medium">
                              {texte.titre}
                            </span>
                            {texte.marche_ville && (
                              <span 
                                className="ml-2 text-xs"
                                style={{ color: colorScheme.secondary }}
                              >
                                — {texte.marche_ville}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IndexRenderer;
