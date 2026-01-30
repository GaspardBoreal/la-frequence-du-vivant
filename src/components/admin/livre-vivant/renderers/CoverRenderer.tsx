import React from 'react';
import type { PageRendererProps } from '@/registries/types';

interface CoverData {
  title?: string;
  subtitle?: string;
  author?: string;
  publisher?: string;
  coverImageUrl?: string;
}

interface CoverRendererProps extends PageRendererProps {
  data: CoverData;
}

const CoverRenderer: React.FC<CoverRendererProps> = ({ 
  data, 
  colorScheme, 
  typography 
}) => {
  const { title, subtitle, author, publisher, coverImageUrl } = data;

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
      className="h-full flex flex-col items-center justify-center p-8 text-center"
      style={previewStyle}
    >
      {coverImageUrl && (
        <img 
          src={coverImageUrl} 
          alt="Couverture"
          className="max-h-40 object-contain mb-6 shadow-lg rounded"
        />
      )}
      <h1 
        className="text-3xl md:text-4xl font-bold mb-2"
        style={headingStyle}
      >
        {title || 'Titre du Recueil'}
      </h1>
      {subtitle && (
        <p 
          className="text-lg md:text-xl italic mb-6"
          style={{ color: colorScheme.secondary }}
        >
          {subtitle}
        </p>
      )}
      <p className="text-base mt-8">{author || 'Auteur'}</p>
      {publisher && (
        <p 
          className="text-sm mt-2"
          style={{ color: colorScheme.secondary }}
        >
          {publisher}
        </p>
      )}
    </div>
  );
};

export default CoverRenderer;
