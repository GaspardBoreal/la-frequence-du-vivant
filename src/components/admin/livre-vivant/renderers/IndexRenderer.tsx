import React from 'react';
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
  typography 
}) => {
  const { textes } = data;
  const indexConfig = getIndexType(indexType);
  const indexData = indexConfig?.extractor(textes);

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

      <div className="space-y-2 flex-1 overflow-auto columns-1 md:columns-2 gap-8">
        {indexData.entries.map((entry, idx) => (
          <div 
            key={idx}
            className="flex items-baseline justify-between gap-2 break-inside-avoid py-1"
          >
            <span className="capitalize">{entry.label}</span>
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndexRenderer;
