import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTextTypesByFamily, type TextTypeInfo } from '@/types/textTypes';
import type { MarcheTexte } from '@/hooks/useMarcheTextes';

interface TextTypeNavigatorProps {
  texts: MarcheTexte[];
  selectedFamily: TextTypeInfo['family'] | 'all';
  onFamilyChange: (family: TextTypeInfo['family'] | 'all') => void;
}

const FAMILY_INFO = {
  all: { label: 'Tous', icon: '📖', color: 'bg-muted' },
  poetique: { label: 'Poétique', icon: '🎋', color: 'bg-violet-100 text-violet-800' },
  narrative: { label: 'Narrative', icon: '📚', color: 'bg-blue-100 text-blue-800' },
  terrain: { label: 'Terrain', icon: '🗒️', color: 'bg-green-100 text-green-800' },
  hybride: { label: 'Hybride', icon: '🤖', color: 'bg-orange-100 text-orange-800' },
};

export default function TextTypeNavigator({ texts, selectedFamily, onFamilyChange }: TextTypeNavigatorProps) {
  // Group texts by family
  const textsByFamily = texts.reduce((acc, text) => {
    const typesByFamily = {
      poetique: ['haiku', 'haibun', 'poeme', 'fragment'],
      narrative: ['texte-libre', 'fable', 'prose', 'correspondance', 'manifeste'],
      terrain: ['essai-bref', 'carnet', 'glossaire'],
      hybride: ['dialogue-polyphonique', 'carte-poetique', 'protocole', 'synthese', 'recit-donnees']
    };
    
    const family = Object.entries(typesByFamily).find(([_, types]) => 
      types.includes(text.type_texte)
    )?.[0] as TextTypeInfo['family'] || 'hybride';
    
    acc[family] = (acc[family] || 0) + 1;
    return acc;
  }, {} as Record<TextTypeInfo['family'], number>);

  const totalTexts = texts.length;

  return (
    <div className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded-lg">
      {/* Family filters */}
      <div className="flex items-center gap-1 flex-1">
        {Object.entries(FAMILY_INFO).map(([family, info]) => {
          const count = family === 'all' ? totalTexts : (textsByFamily[family as TextTypeInfo['family']] || 0);
          const isActive = selectedFamily === family;
          const hasTexts = count > 0;
          
          if (!hasTexts && family !== 'all') return null;

          return (
            <Button
              key={family}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onFamilyChange(family as TextTypeInfo['family'] | 'all')}
              className="h-7 px-2 text-xs font-medium"
              disabled={!hasTexts}
            >
              <span className="mr-1">{info.icon}</span>
              {info.label}
              {hasTexts && (
                <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px] px-1">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Text count summary */}
      <div className="text-xs text-muted-foreground font-mono">
        {totalTexts} texte{totalTexts > 1 ? 's' : ''}
      </div>
    </div>
  );
}