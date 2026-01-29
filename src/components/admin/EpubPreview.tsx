import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, FileText, Image as ImageIcon, Layout } from 'lucide-react';
import type { EpubExportOptions, TexteExport } from '@/utils/epubExportUtils';

interface EpubPreviewProps {
  textes: TexteExport[];
  options: EpubExportOptions;
}

const EpubPreview: React.FC<EpubPreviewProps> = ({ textes, options }) => {
  const { colorScheme, typography } = options;

  // Get a sample text for preview
  const sampleText = useMemo(() => {
    const haiku = textes.find(t => t.type_texte.toLowerCase() === 'haiku');
    const poem = textes.find(t => t.type_texte.toLowerCase() === 'poeme');
    const fable = textes.find(t => t.type_texte.toLowerCase() === 'fable');
    return haiku || poem || fable || textes[0];
  }, [textes]);

  const previewStyle = useMemo(() => ({
    fontFamily: `'${typography.bodyFont}', Georgia, serif`,
    fontSize: `${typography.baseFontSize}rem`,
    lineHeight: typography.lineHeight,
    color: colorScheme.text,
    backgroundColor: colorScheme.background,
  }), [colorScheme, typography]);

  const headingStyle = useMemo(() => ({
    fontFamily: `'${typography.headingFont}', serif`,
    color: colorScheme.primary,
  }), [colorScheme, typography]);

  // Strip HTML tags for preview
  const stripHtml = (html: string): string => {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200) + '...';
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <Tabs defaultValue="cover" className="w-full">
        <TabsList className="w-full grid grid-cols-4 rounded-none border-b border-border/50">
          <TabsTrigger value="cover" className="text-xs gap-1">
            <Book className="h-3 w-3" />
            Couverture
          </TabsTrigger>
          <TabsTrigger value="partie" className="text-xs gap-1">
            <Layout className="h-3 w-3" />
            Partie
          </TabsTrigger>
          <TabsTrigger value="texte" className="text-xs gap-1">
            <FileText className="h-3 w-3" />
            Texte
          </TabsTrigger>
          <TabsTrigger value="illustration" className="text-xs gap-1">
            <ImageIcon className="h-3 w-3" />
            Visuel
          </TabsTrigger>
        </TabsList>

        {/* Cover Preview */}
        <TabsContent value="cover" className="m-0">
          <div 
            className="h-[400px] flex flex-col items-center justify-center p-8 text-center"
            style={previewStyle}
          >
            {options.coverImageUrl && (
              <img 
                src={options.coverImageUrl} 
                alt="Couverture"
                className="max-h-32 object-contain mb-6 shadow-lg rounded"
              />
            )}
            <h1 
              className="text-3xl font-bold mb-2"
              style={headingStyle}
            >
              {options.title || 'Titre du Recueil'}
            </h1>
            {options.subtitle && (
              <p 
                className="text-lg italic mb-6"
                style={{ color: colorScheme.secondary }}
              >
                {options.subtitle}
              </p>
            )}
            <p className="text-base mt-8">{options.author || 'Auteur'}</p>
            {options.publisher && (
              <p 
                className="text-sm mt-2"
                style={{ color: colorScheme.secondary }}
              >
                {options.publisher}
              </p>
            )}
          </div>
        </TabsContent>

        {/* Partie Preview */}
        <TabsContent value="partie" className="m-0">
          <div 
            className="h-[400px] flex flex-col items-center justify-center p-8 text-center"
            style={previewStyle}
          >
            <p 
              className="text-6xl font-bold mb-4"
              style={headingStyle}
            >
              I
            </p>
            <h2 
              className="text-2xl uppercase tracking-widest mb-2"
              style={headingStyle}
            >
              MOUVEMENT PREMIER
            </h2>
            <p 
              className="text-lg italic"
              style={{ color: colorScheme.secondary }}
            >
              La descente vers l'embouchure
            </p>
            <p 
              className="mt-8 text-2xl tracking-[0.5em]"
              style={{ color: colorScheme.accent }}
            >
              ───────────
            </p>
          </div>
        </TabsContent>

        {/* Text Preview */}
        <TabsContent value="texte" className="m-0">
          <div 
            className="h-[400px] p-6 overflow-auto"
            style={previewStyle}
          >
            {/* Marche Header */}
            <div 
              className="mb-4 pb-2"
              style={{ borderBottom: `2px solid ${colorScheme.accent}` }}
            >
              <h2 
                className="text-xl font-semibold"
                style={headingStyle}
              >
                {sampleText?.marche_nom || sampleText?.marche_ville || 'Bergerac'}
              </h2>
              <p 
                className="text-sm italic"
                style={{ color: colorScheme.secondary }}
              >
                {sampleText?.marche_date 
                  ? new Date(sampleText.marche_date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Samedi 15 mars 2024'
                }
              </p>
            </div>

            {/* Type Header */}
            <h3 
              className="text-sm uppercase tracking-wide mb-3"
              style={{ color: colorScheme.secondary }}
            >
              {sampleText?.type_texte || 'Haïkus'}
            </h3>

            {/* Text Content */}
            <div className="mb-4">
              <h4 
                className="text-base font-semibold mb-2"
                style={headingStyle}
              >
                {sampleText?.titre || 'Titre du texte'}
              </h4>
              <div className={sampleText?.type_texte?.toLowerCase() === 'haiku' ? 'text-center' : ''}>
                <p className="mb-2">
                  {sampleText ? stripHtml(sampleText.contenu) : 'Contenu du texte littéraire...'}
                </p>
              </div>
            </div>

            {/* Second sample text */}
            {textes.length > 1 && (
              <div className="mb-4">
                <h4 
                  className="text-base font-semibold mb-2"
                  style={headingStyle}
                >
                  {textes[1]?.titre || 'Second texte'}
                </h4>
                <p className="mb-2">
                  {textes[1] ? stripHtml(textes[1].contenu) : '...'}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Illustration Preview */}
        <TabsContent value="illustration" className="m-0">
          <div 
            className="h-[400px] flex flex-col items-center justify-center p-8"
            style={previewStyle}
          >
            <div 
              className="w-full max-w-xs aspect-[4/3] rounded-lg flex items-center justify-center mb-4"
              style={{ 
                backgroundColor: colorScheme.secondary + '20',
                border: `2px dashed ${colorScheme.secondary}`,
              }}
            >
              <ImageIcon 
                className="w-16 h-16"
                style={{ color: colorScheme.secondary }}
              />
            </div>
            <p 
              className="text-sm italic text-center"
              style={{ color: colorScheme.secondary }}
            >
              Croquis de terrain — Vue sur le fleuve à l'aube
            </p>
            
            {/* QR Code placeholder */}
            <div className="mt-6 text-center">
              <div 
                className="w-20 h-20 mx-auto rounded flex items-center justify-center mb-2"
                style={{ 
                  backgroundColor: colorScheme.background,
                  border: `1px solid ${colorScheme.secondary}`,
                }}
              >
                <div 
                  className="w-16 h-16 grid grid-cols-4 grid-rows-4 gap-0.5"
                  style={{ backgroundColor: colorScheme.text }}
                >
                  {[...Array(16)].map((_, i) => (
                    <div 
                      key={i}
                      style={{ 
                        backgroundColor: Math.random() > 0.5 ? colorScheme.background : colorScheme.text 
                      }}
                    />
                  ))}
                </div>
              </div>
              <p 
                className="text-xs"
                style={{ color: colorScheme.secondary }}
              >
                Écouter l'ambiance sonore
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Footer with Stats */}
      <div 
        className="px-4 py-2 text-xs border-t"
        style={{ 
          borderColor: colorScheme.secondary + '30',
          color: colorScheme.secondary,
          backgroundColor: colorScheme.background,
        }}
      >
        Aperçu • {textes.length} textes • Police: {typography.bodyFont} / {typography.headingFont}
      </div>
    </Card>
  );
};

export default EpubPreview;
