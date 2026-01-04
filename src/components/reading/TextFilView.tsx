// Text Fil View - Chronological list of all texts
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTextTypeInfo, TextType } from '@/types/textTypes';

interface TextItem {
  id: string;
  titre: string;
  type_texte: TextType;
  marche_id: string;
  marcheNomMarche?: string;
  marcheVille?: string;
}

interface TextFilViewProps {
  texts: TextItem[];
  currentTextIndex: number;
  onTextSelect: (index: number) => void;
}

export default function TextFilView({
  texts,
  currentTextIndex,
  onTextSelect
}: TextFilViewProps) {
  if (texts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p>Aucun texte disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {texts.map((text, index) => {
        const isCurrentText = index === currentTextIndex;
        const typeInfo = getTextTypeInfo(text.type_texte);
        
        return (
          <motion.div
            key={text.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <Button
              variant="ghost"
              onClick={() => onTextSelect(index)}
              className={cn(
                "w-full justify-start text-left p-3 h-auto rounded-lg transition-all",
                isCurrentText 
                  ? "bg-emerald-500/10 border border-emerald-500/20" 
                  : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-start gap-3 w-full">
                {/* Reading indicator or index */}
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                  {isCurrentText ? (
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  )}
                </div>
                
                {/* Text info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <span className={cn(
                    "font-medium text-sm line-clamp-2",
                    isCurrentText ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                  )}>
                    {text.titre}
                  </span>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Literary type badge */}
                    {typeInfo && (
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] px-1.5 py-0 h-5 gap-1"
                      >
                        <span>{typeInfo.icon}</span>
                        <span>{typeInfo.label}</span>
                      </Badge>
                    )}
                    
                    {/* Marche location */}
                    {text.marcheVille && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {text.marcheVille}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}
