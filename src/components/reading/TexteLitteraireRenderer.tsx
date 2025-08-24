// Elegant renderer for different literary text types
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getTextTypeInfo, TextType } from '@/types/textTypes';
import { MarcheTexte } from '@/hooks/useMarcheTextes';
import { Volume2, Image, Palette } from 'lucide-react';

interface TexteLitteraireRendererProps {
  texte: MarcheTexte;
  compact?: boolean;
  showMeta?: boolean;
}

// Special renderer for different text types
function renderTextByType(texte: MarcheTexte, typeInfo: ReturnType<typeof getTextTypeInfo>) {
  const { contenu, type_texte, metadata } = texte;

  switch (type_texte) {
    case 'haiku':
      return (
        <div className="text-center space-y-4">
          <div className="font-serif text-lg leading-loose text-center max-w-md mx-auto">
            {contenu.split('\n').map((line, index) => (
              <div key={index} className="mb-2">
                {line}
              </div>
            ))}
          </div>
        </div>
      );

    case 'haibun':
      const parts = contenu.split('---'); // Prose part --- Haiku part
      return (
        <div className="space-y-6">
          <div className="prose prose-sm max-w-none font-serif leading-relaxed">
            {parts[0]}
          </div>
          {parts[1] && (
            <>
              <Separator className="my-6" />
              <div className="text-center font-serif text-lg leading-loose italic">
                {parts[1].split('\n').map((line, index) => (
                  <div key={index} className="mb-1">
                    {line}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );

    case 'dialogue-polyphonique':
      const dialogues = contenu.split('\n').filter(line => line.trim());
      return (
        <div className="space-y-4">
          {dialogues.map((line, index) => {
            const match = line.match(/^(\[.*?\]|\*.*?\*|—\s*\w+\s*:)\s*(.*)$/);
            if (match) {
              const [, speaker, text] = match;
              const isAI = speaker.toLowerCase().includes('machine') || speaker.toLowerCase().includes('ia');
              const isNature = speaker.toLowerCase().includes('vivant') || speaker.toLowerCase().includes('nature');
              
              return (
                <div key={index} className={`flex gap-3 ${
                  isAI ? 'justify-end' : isNature ? 'justify-center' : 'justify-start'
                }`}>
                  <div className={`max-w-[80%] ${
                    isAI ? 'bg-blue-50 border-blue-200 text-blue-900' :
                    isNature ? 'bg-green-50 border-green-200 text-green-900' :
                    'bg-gray-50 border-gray-200'
                  } border rounded-lg p-3`}>
                    <div className="text-xs font-medium mb-1 opacity-70">
                      {speaker}
                    </div>
                    <div className="text-sm leading-relaxed">
                      {text}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={index} className="text-sm leading-relaxed text-center italic text-muted-foreground">
                {line}
              </div>
            );
          })}
        </div>
      );

    case 'fragment':
      return (
        <div className="text-center">
          <blockquote className="text-xl font-serif italic leading-loose border-l-4 border-primary pl-6 max-w-2xl mx-auto">
            {contenu}
          </blockquote>
        </div>
      );

    case 'fable':
      const paragraphs = contenu.split('\n\n');
      const morale = paragraphs[paragraphs.length - 1];
      const story = paragraphs.slice(0, -1).join('\n\n');
      
      return (
        <div className="space-y-6">
          <div className="prose prose-sm max-w-none leading-relaxed">
            {story}
          </div>
          {morale && (
            <>
              <Separator />
              <div className="text-center italic text-primary font-medium">
                {morale}
              </div>
            </>
          )}
        </div>
      );

    case 'carte-poetique':
      return (
        <div className="space-y-6">
          <div className="prose prose-sm max-w-none">
            {contenu}
          </div>
          
          {metadata?.spectrograms && (
            <div className="grid gap-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Spectrogrammes associés
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {metadata.spectrograms.map((spec: any, index: number) => (
                  <div key={index} className="bg-muted/20 border rounded p-3 text-xs">
                    {spec.name || `Spectrogramme ${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {metadata?.drawings && (
            <div className="grid gap-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Dessins poétiques
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {metadata.drawings.map((drawing: any, index: number) => (
                  <div key={index} className="aspect-square bg-muted/20 border rounded p-2 text-xs flex items-center justify-center">
                    {drawing.name || `Dessin ${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case 'essai-bref':
      return (
        <div className="prose prose-sm max-w-none leading-relaxed">
          <div className="font-medium text-primary mb-4 text-lg">
            {contenu.split('\n')[0]}
          </div>
          <div className="space-y-3">
            {contenu.split('\n').slice(1).map((paragraph, index) => (
              <p key={index} className="mb-3">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className="prose prose-sm max-w-none leading-relaxed whitespace-pre-wrap">
          {contenu}
        </div>
      );
  }
}

export default function TexteLitteraireRenderer({ 
  texte, 
  compact = false, 
  showMeta = true 
}: TexteLitteraireRendererProps) {
  const typeInfo = getTextTypeInfo(texte.type_texte);

  if (compact) {
    return (
      <div className="border-l-2 border-primary/20 pl-4 py-2">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            {typeInfo.icon} {typeInfo.label}
          </Badge>
          <span className="text-sm font-medium">{texte.titre}</span>
        </div>
        <div className="text-sm text-muted-foreground line-clamp-3">
          {texte.contenu}
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {typeInfo.icon} {typeInfo.label}
              </Badge>
              {showMeta && (
                <span className="text-xs text-muted-foreground">
                  {new Date(texte.created_at).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {texte.titre}
            </h3>
          </div>
        </div>
        
        {typeInfo.description && (
          <p className="text-sm text-muted-foreground italic">
            {typeInfo.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div 
          className={`
            ${typeInfo.adaptiveStyle.fontFamily === 'serif' ? 'font-serif' : 
              typeInfo.adaptiveStyle.fontFamily === 'monospace' ? 'font-mono' : 'font-sans'
            }
            ${typeInfo.adaptiveStyle.fontSize}
            ${typeInfo.adaptiveStyle.lineHeight}
            ${typeInfo.adaptiveStyle.spacing}
          `}
        >
          {renderTextByType(texte, typeInfo)}
        </div>
        
        {showMeta && texte.metadata && Object.keys(texte.metadata).length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Image className="h-3 w-3" />
              Éléments multimédias associés
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}