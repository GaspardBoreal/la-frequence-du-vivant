import React from 'react';
import type { PageRendererProps } from '@/registries/types';

interface PartieData {
  partie: {
    id: string;
    numeroRomain: string;
    titre: string;
    sousTitre?: string;
  };
  groupIndex: number;
}

interface PartieRendererProps extends PageRendererProps {
  data: PartieData;
}

const PartieRenderer: React.FC<PartieRendererProps> = ({ 
  data, 
  colorScheme, 
  typography 
}) => {
  const { partie } = data;

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
      <p 
        className="text-6xl md:text-7xl font-bold mb-4"
        style={headingStyle}
      >
        {partie.numeroRomain}
      </p>
      <h2 
        className="text-2xl md:text-3xl uppercase tracking-widest mb-2"
        style={headingStyle}
      >
        {partie.titre}
      </h2>
      {partie.sousTitre && (
        <p 
          className="text-lg md:text-xl italic"
          style={{ color: colorScheme.secondary }}
        >
          {partie.sousTitre}
        </p>
      )}
      <p 
        className="mt-8 text-2xl tracking-[0.5em]"
        style={{ color: colorScheme.accent }}
      >
        ───────────
      </p>
    </div>
  );
};

export default PartieRenderer;
