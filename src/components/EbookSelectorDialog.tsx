import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';

interface EbookDirection {
  key: 'galerie_fleuve' | 'frequence_vivant' | 'dordonia';
  label: string;
  description: string;
  colorPreview: string;
  backgroundPreview: string;
  url: string;
}

const EBOOK_DIRECTIONS: EbookDirection[] = [
  {
    key: 'galerie_fleuve',
    label: 'Galerie Fleuve',
    description: 'Style galerie d\'art épuré, fond blanc, accents émeraude',
    colorPreview: '#10B981',
    backgroundPreview: '#ffffff',
    url: '/epub/frequences-de-la-riviere-dordogne-atlas-des-vivant-2026-02-01-5257/lire'
  },
  {
    key: 'frequence_vivant',
    label: 'Fréquence du Vivant',
    description: 'Thème nocturne forêt, fond sombre, accents menthe',
    colorPreview: '#22C55E',
    backgroundPreview: '#14281D',
    url: '/epub/frequences-de-la-riviere-dordogne-atlas-des-vivant-2026-02-01-ukcu/lire'
  },
  {
    key: 'dordonia',
    label: 'Dordonia',
    description: 'Thème nocturne rivière, fond bleu nuit, accents cyan',
    colorPreview: '#22D3EE',
    backgroundPreview: '#0F172A',
    url: '/epub/frequences-de-la-riviere-dordogne-atlas-des-vivant-2026-02-01-nwj6/lire'
  }
];

interface EbookSelectorDialogProps {
  trigger: React.ReactNode;
}

const EbookSelectorDialog: React.FC<EbookSelectorDialogProps> = ({ trigger }) => {
  const handleSelect = (url: string) => {
    window.location.href = url;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-md border-border/50">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl font-crimson">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Lire le Livre Vivant
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Choisissez votre expérience de lecture
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
          {EBOOK_DIRECTIONS.map((direction, index) => (
            <motion.button
              key={direction.key}
              onClick={() => handleSelect(direction.url)}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card hover:border-primary/50 transition-all duration-300 text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: `0 8px 30px -10px ${direction.colorPreview}40`
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Color band */}
              <div 
                className="h-16 w-full relative overflow-hidden"
                style={{ backgroundColor: direction.backgroundPreview }}
              >
                {/* Accent circle */}
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full opacity-80 group-hover:scale-125 transition-transform duration-300"
                  style={{ backgroundColor: direction.colorPreview }}
                />
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                  style={{ 
                    background: `radial-gradient(circle at center, ${direction.colorPreview}60 0%, transparent 70%)` 
                  }}
                />
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {direction.label}
                </h3>
                <p className="text-xs text-muted-foreground flex-1">
                  {direction.description}
                </p>
                
                {/* Link indicator */}
                <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground/60 group-hover:text-primary/80 transition-colors">
                  <ExternalLink className="h-3 w-3" />
                  <span>Ouvrir</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EbookSelectorDialog;
